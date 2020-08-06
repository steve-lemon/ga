/**
 * file: `main.ts`
 * - run main program
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-07-17 initial version.
 */
import { _log, $U, getRunParam, _inf, loadJsonSync } from 'lemon-core';
import { loaodTsp, TravelingSalesMan, saveJsonSync, Solution } from './ga';
import http from 'http';
import fs from 'fs';
const NS = $U.NS('main', 'yellow');

/**
 * download remote file(.tsp) into `./data/` folder if not exits.
 *
 * @param name     file-name of `.tsp`
 */
export const downloadFile = async (name: string): Promise<string> =>
    new Promise((resolve, reject) => {
        name = `${name}${name.endsWith('.tsp') ? '' : '.tsp'}`.trim();

        //! check if exists in `./`
        if (fs.existsSync(`./${name}`)) {
            const body = fs.readFileSync(`./${name}`).toString();
            if (body.startsWith('NAME:')) return resolve(`./${name}`);
        }

        //! check if exists in `./data/`
        const path = `./data/${name}`;
        if (fs.existsSync(path)) {
            const body = fs.readFileSync(path).toString();
            if (body.startsWith('NAME:')) return resolve(path);
        }

        //! download & save from remote..
        http.get(`http://elib.zib.de/pub/mp-testdata/tsp/tsplib/tsp/${name}`, res => {
            if (res.statusCode != 200) return reject(new Error(`FILE NOT FOUND - ${name}`));
            const bufs: any[] = [];
            res.on('data', chunk => bufs.push(chunk));
            res.on('end', () => {
                const buf = Buffer.concat(bufs);
                const body = buf.toString();
                fs.writeFileSync(path, body);
                return resolve(path);
            });
        });
    });

/**
 * normalize run arguments
 *
 * ```
 * # case#1 use the file-name
 * npm start -p 12 abc.tsp
 *
 * # case#2 use default `bier127.tsp`
 * npm . -pop 20
 * ```
 * @param argv
 */
export const normalizeArguments = (argv: string[]): string[] => {
    const [last] = argv.slice(-1);
    //! if len is odd & last is like `xxx.tsp`
    if (argv.length % 2 == 1 && last.endsWith('.tsp')) {
        argv = argv.slice(0, argv.length - 1).concat(['-name', last, '-ext', '0']);
    }

    //! replace `-p` -> `-pop`, `-f` -> `-fit`
    argv = argv.map((a, i) => (i % 2 == 0 ? (a == '-p' ? '-pop' : a == '-f' ? '-fit' : a) : a));

    //! returns
    return argv;
};

/**
 * pack arguments as param
 * @param argv
 */
export const packArguments = (argv: string[]) => {
    // const _log = console.info;
    _log(NS, `> argv[${argv.length}] =`, argv.slice(2).join(' '));
    const asParam = (a: string, b: any) => getRunParam(a, b, argv);
    const len = argv.length;

    //! get param..
    const ext = asParam('ext', len <= 2 ? 0 : 1) as number; // flag of extenstion.
    const name = asParam('name', ext ? 'bier127' : '') as string;
    const pop = asParam('pop', ext ? 20 : 0) as number;
    const fit = asParam('fit', ext ? -1 : 0) as number;
    const gen = asParam('gen', ext ? 50 : 0) as number;
    const epo = asParam('epo', ext ? 50 : 1) as number;
    const gap = asParam('gap', 1) as number;
    const min = asParam('min', 0) as number;
    const max = asParam('max', 1) as number;
    const deep = asParam('deep', 0) as number; // flag to find by deep()
    const short = asParam('short', 0) as number; // flag to optimize by short()
    const best = asParam('best', 0) as number; // flag to show the latest best solution
    const param = { ext, name, pop, fit, gen, epo, gap, min, max, deep, short, best };
    _inf(NS, `! param =`, $U.json(param));

    //! validate param.
    if (!name) throw new Error('-name (or tsp-file) is required!');
    if (!pop) throw new Error('-pop (or -p) is required!');
    if (!fit) throw new Error('-fit (or -f) is required!');

    //! returns.
    return param;
};

/**
 * main function.
 *
 * ```sh
 * $ node . -pop 512 -gen 512 -epo 350 -max 500 -min 5
 * ```
 * @param argv cli arguments.
 */
export const main = async (argv: string[]) => {
    _log(NS, '!main()...');

    //! get param..
    const { name, pop, fit, gen, epo, gap, min, max, deep, short, best: showBest } = packArguments(
        normalizeArguments(argv),
    );

    //! load tsp file.
    const file = await downloadFile(name);
    const $tsp = loaodTsp(file);
    _log(NS, `> tsp.name =`, $tsp.name);
    _log(NS, `> tsp.length =`, $tsp.nodes.length);
    const fn = (n: number) => (n < 10 ? '000' : n < 100 ? '00' : n < 1000 ? '0' : '') + `${n}`;
    const f2 = (v: number) => Math.round(v * 100) / 100;
    const $ret = { cost: 0, route: [] as string[] };

    //! search by exhaustive approach.
    if (deep) {
        _inf(NS, `! find by deep search`);
        const $tsm = new TravelingSalesMan($tsp.nodes);
        const best = $tsm.findDeep();
        _inf(NS, `> best.fit[${f2(best.fit)}] =`, best.sol.slice(0, 16).join(', '));
        saveJsonSync('data/best-deep.json', best);
        $ret.cost = best.fit;
        $ret.route = [...best.sol].map(i => $tsm.cities[i]).map(c => `${c.i}`);
        return $ret;
    }

    //! optimize to shorten in range.
    //$ node . -max 10 -short 1 -min 1 -gap 10
    if (short) {
        _inf(NS, `! optimize by short()`);
        const $tsm = new TravelingSalesMan($tsp.nodes);
        const best: Solution = loadJsonSync('data/best.json');
        _inf(NS, `> best.fit[${f2(best.fit)}] =`, best.sol.slice(0, 16).join(', '));
        for (let i = min; i < $tsp.nodes.length - max; i += gap) {
            const thiz: Solution = { fit: best.fit, sol: [...best.sol] };
            const $new = $tsm.shorten(thiz, i, i + max);
            const diff = Math.abs(best.fit - $new.fit) < 0.0001 ? '' : '*';
            _inf(NS, `> $new[${i}:${i + max}].fit[${f2($new.fit)}]${diff} =`, $new.sol.slice(0, 16).join(', '));
            //! update the best..
            if ($new.fit < best.fit) {
                best.fit = $new.fit;
                best.sol = [...$new.sol];
                saveJsonSync('data/best-short.json', best);
            }
        }
        $ret.cost = best.fit;
        $ret.route = [...best.sol].map(i => $tsm.cities[i]).map(c => `${c.i}`);
        return $ret;
    }

    //! show the best solution.
    if (showBest) {
        _inf(NS, `! show the latest best solution`);
        const $tsm = new TravelingSalesMan($tsp.nodes);
        const best: Solution = loadJsonSync('data/best.json');
        $ret.cost = best.fit;
        $ret.route = [...best.sol].map(i => $tsm.cities[i]).map(c => `${c.i}`);
        return $ret;
    }

    //! execute find of TravelingSalesMan by name. from min to max.
    for (let n = min; n < max; n++) {
        const $tsm = new TravelingSalesMan($tsp.nodes);
        $tsm.$best.name = `data/best-${fn(n)}.json`;
        for (let i = 1; i <= epo; i++) {
            const best = $tsm.find(pop, gen, fit);
            _inf(NS, `> route[${n}/${i}][${f2(best.fit)}] =`, best.sol.slice(0, 16).join(', '));

            //! update the last best...
            const $org: any = loadJsonSync('data/best.json');
            if (
                $org.error || // best has error
                ($org.fit > best.fit && best.fit > 0) || // improved
                !$org.sol || // missing solution
                $org.sol.length != best.sol.length // different solution length
            ) {
                _inf(NS, `! update last best: ${best.fit || 0} <- ${$org.fit || 0}`);
                saveJsonSync('data/best.json', best);
                $ret.cost = best.fit;
                $ret.route = [...best.sol].map(i => $tsm.cities[i]).map(c => `${c.i}`);
            } else {
                $ret.cost = $org.fit;
                $ret.route = [...$org.sol].map(i => $tsm.cities[i]).map(c => `${c ? c.i : ''}`);
            }
        }
    }

    //! returns best route.
    return $ret;
};
