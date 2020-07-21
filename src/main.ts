/**
 * file: `main.ts`
 * - run main program
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-07-17 initial version.
 */
import { _log, $U, getRunParam, _inf } from 'lemon-core';
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
    _inf(NS, `! conf =`, { name, pop, gen });

    //! load tsp
    const $tsp = loaodTsp(name);
    _log(NS, `> tsp.name =`, $tsp.name);
    _log(NS, `> tsp.length =`, $tsp.nodes.length);

    //! create TravelingSalesMan
    const $tsm = new TravelingSalesMan($tsp.nodes);
    let route = null;
    for (let i = 1; i <= epoch; i++) {
        route = $tsm.findRoute(pop, gen);
        //! print the result.
        if (!(i % 5))
            _inf(NS, `> route[${i}][${Math.round(route.cost * 100) / 100}] =`, route.route.slice(0, 16).join(', '));
    }
    saveJsonSync('data/result.txt', route.route.join('\n'));
};
