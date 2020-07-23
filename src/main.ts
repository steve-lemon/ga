/**
 * file: `main.ts`
 * - run main program
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-07-17 initial version.
 */
import { _log, $U, getRunParam, _inf, loadJsonSync } from 'lemon-core';
import { loaodTsp, TravelingSalesMan, saveJsonSync, Solution } from './ga';
const NS = $U.NS('main', 'yellow');

/**
 * main function.
 *
 * ```sh
 * $ node . -pop 512 -gen 512 -epo 350 -max 500 -min 5
 * ```
 * @param argv cli arguments.
 */
export const main = (argv: string[]) => {
    _log(NS, '!main()...');
    _log(NS, '> argv =', argv.slice(2).join(' '));

    //! get param..
    const name = getRunParam('name', 'bier127') as string;
    const pop = getRunParam('pop', 20) as number;
    const gen = getRunParam('gen', 50) as number;
    const epo = getRunParam('epo', 50) as number;
    const gap = getRunParam('gap', 1) as number;
    const min = getRunParam('min', 0) as number;
    const max = getRunParam('max', 1) as number;
    const deep = getRunParam('deep', 0) as number; // flag to find by deep()
    const short = getRunParam('short', 0) as number; // flag to optimize by short()
    _inf(NS, `! conf =`, $U.json({ name, pop, gen, epoch: epo, min, max }));

    //! load tsp file.
    const $tsp = loaodTsp(name);
    _log(NS, `> tsp.name =`, $tsp.name);
    _log(NS, `> tsp.length =`, $tsp.nodes.length);
    const fn = (n: number) => (n < 10 ? '000' : n < 100 ? '00' : n < 1000 ? '0' : '') + `${n}`;
    const f2 = (v: number) => Math.round(v * 100) / 100;

    //! search by exhaustive approach.
    if (deep) {
        _inf(NS, `! find by deep search`);
        const $tsm = new TravelingSalesMan($tsp.nodes);
        const best = $tsm.findDeep();
        _inf(NS, `> best.fit[${f2(best.fit)}] =`, best.sol.slice(0, 16).join(', '));
        saveJsonSync('data/best-deep.json', best);
        return;
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
        return;
    }

    //! execute find of TravelingSalesMan by name. from min to max.
    for (let n = min; n < max; n++) {
        const $tsm = new TravelingSalesMan($tsp.nodes);
        $tsm.$best.name = `data/best-${fn(n)}.json`;
        for (let i = 1; i <= epo; i++) {
            const best = $tsm.find(pop, gen);
            _inf(NS, `> route[${n}/${i}][${f2(best.fit)}] =`, best.sol.slice(0, 16).join(', '));

            //! update the last best...
            const $org: any = loadJsonSync('data/best.json');
            if ($org.error || ($org && $org.fit > best.fit && best.fit > 0)) {
                _inf(NS, `! update last best: ${best.fit || 0} <- ${$org.fit || 0}`);
                saveJsonSync('data/best.json', best);
            }
        }
    }
};
