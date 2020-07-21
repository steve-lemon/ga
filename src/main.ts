/**
 * file: `main.ts`
 * - run main program
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-07-17 initial version.
 */
import { _log, $U, getRunParam, _inf, loadJsonSync } from 'lemon-core';
import { loaodTsp, TravelingSalesMan, saveJsonSync } from './ga';
const NS = $U.NS('main', 'yellow');

/**
 * main function.
 * @param argv cli arguments.
 */
export const main = (argv: string[]) => {
    _log(NS, '!main()...');
    _log(NS, '> argv =', argv.slice(2).join(' '));

    //! get param..
    const name = getRunParam('name', 'bier127') as string;
    const pop = getRunParam('pop', 20) as number;
    const gen = getRunParam('gen', 50) as number;
    const epoch = getRunParam('epo', 50) as number;
    const max = getRunParam('max', 1) as number;
    _inf(NS, `! conf =`, { name, pop, gen, epoch, max });

    //! load tsp
    const $tsp = loaodTsp(name);
    _log(NS, `> tsp.name =`, $tsp.name);
    _log(NS, `> tsp.length =`, $tsp.nodes.length);

    //! create TravelingSalesMan
    const fn = (n: number) => (n < 10 ? '000' : n < 100 ? '00' : n < 1000 ? '0' : '') + `${n}`;
    for (let n = 0; n < max; n++) {
        const $tsm = new TravelingSalesMan($tsp.nodes);
        $tsm.$best.name = `data/best-${fn(n)}.json`;
        for (let i = 1; i <= epoch; i++) {
            const best = $tsm.find(pop, gen);
            _inf(NS, `> route[${n}/${i}][${Math.round(best.fit * 100) / 100}] =`, best.sol.slice(0, 16).join(', '));

            //! update the last best...
            const $org: any = loadJsonSync('data/best.json');
            if ($org.error || ($org && $org.fit > best.fit && best.fit > 0)) {
                _inf(NS, `! update last best: ${best.fit || 0} <- ${$org.fit || 0}`);
                saveJsonSync('data/best.json', best);
            }
        }
    }
};
