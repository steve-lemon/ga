/**
 * file: `ga.spec.ts`
 * - spec for ga
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-07-17 initial version.
 */
import { expect2, $_, $U } from 'lemon-core';
import { fitness, random_solution, crossover, find, loaodTsp, TravelingSalesMan, Solution } from './ga';

describe('gs', () => {
    it('should pass all', () => {
        expect(fitness({ sol: [0] })).toBe(0);
        expect(fitness({ sol: [1, 2, 3, 4] }, [0, 2, 0])).toBe(1);
        expect(random_solution(2).sol.length).toBe(2);

        //! crossover
        expect(crossover({ sol: [1, 2, 3] }, { sol: [4, 5, 6] }, 1)).toEqual({
            off1: { sol: [1, 5, 6] },
            off2: { sol: [4, 2, 3] },
        });
        expect(crossover({ sol: [1, 2, 3] }, { sol: [4, 5, 6] }, 2)).toEqual({
            off1: { sol: [1, 2, 6] },
            off2: { sol: [4, 5, 3] },
        });
        expect(crossover({ sol: [1, 2, 3] }, { sol: [4, 5, 6] }, 3)).toEqual({
            off1: { sol: [1, 2, 3] },
            off2: { sol: [4, 5, 6] },
        });

        //! find()
        expect2(() => find(10, 50)).toEqual({ fit: 4, sol: [1, 0, 4, 9] });
    });

    it('should pass TSP tools', () => {
        // eslint-disable-next-line prettier/prettier
        expect2(() => /([0-9]+)\s+([0-9]+)/.exec(' 1   234 789').toString()).toEqual(['1   234', '1', '234'].toString());
        expect2(() => loaodTsp('bier127.json')).toEqual(
            '{"errno":-2,"syscall":"open","code":"ENOENT","path":"./data/bier127.json.tsp"}',
        );
        expect2(() => loaodTsp('bier127.tsp'), 'name').toEqual({ name: 'bier127' });

        //! test data loading..
        const $tsp = loaodTsp('bier127');
        expect2(() => ({ ...$tsp }), '!nodes').toEqual({
            name: 'bier127',
            comment: '127 Biergaerten in Augsburg (Juenger/Reinelt)',
            type: 'TSP',
            dimension: 127,
            edge_weight_type: 'EUC_2D',
        });

        expect2(() => $tsp.nodes[0]).toEqual([1, 9860, 14152]);
        expect2(() => $tsp.nodes[1]).toEqual([2, 9396, 14616]);
        expect2(() => $tsp.nodes[126]).toEqual([127, 3248, 14152]);
    });

    it('should pass TravelingSalesMan', () => {
        const $tsp = loaodTsp('bier127');
        expect2(() => $tsp, 'name').toEqual({ name: 'bier127' });

        const $tsm = new TravelingSalesMan($tsp.nodes);
        expect2(() => $tsm.distance({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual(Math.sqrt(2 ** 2 + 2 ** 2));
        expect2(() => $tsm.cities[0]).toEqual({ i: 1, x: 9860, y: 14152 });
        expect2(() => $tsm.cities[1]).toEqual({ i: 2, x: 9396, y: 14616 });
        expect2(() => $tsm.cities[126]).toEqual({ i: 127, x: 3248, y: 14152 });

        //! test travels()
        const DIST_0_TO_1 = $tsm.distance({ i: 1, x: 9860, y: 14152 }, { i: 2, x: 9396, y: 14616 });
        expect2(() => $tsm.travels([0, 1])).toEqual(DIST_0_TO_1 * 2);
        expect2(() => $tsm.travels([1, 0])).toEqual(DIST_0_TO_1 * 2);
        // const inOrder = Array.from(Array(127)).map((_, i) => i);
        // const inOrder = [...Array(127).keys()];
        const inOrder = $_.range(0, 127); //! use lodash.
        expect2(() => inOrder.length).toEqual(127);
        expect2(() => inOrder.slice(0, 3)).toEqual([0, 1, 2]);
        expect2(() => inOrder.slice(125)).toEqual([125, 126]);
        expect2(() => Math.round($tsm.travels(inOrder) * 100)).toEqual(393998.28 * 100);

        //! test metrics
        expect2(() => $tsm.metrics[0][0]).toEqual(0);
        expect2(() => $tsm.metrics[1][0]).toEqual(DIST_0_TO_1);
        expect2(() => $tsm.metrics[0][1]).toEqual($tsm.distance($tsm.cities[0], $tsm.cities[1]));
        expect2(() => $tsm.metrics[1][0]).toEqual($tsm.distance($tsm.cities[1], $tsm.cities[0]));
        expect2(() => $tsm.distByIndex(0, 1)).toEqual($tsm.distance($tsm.cities[1], $tsm.cities[0]));

        //! test reorder()
        expect2(() => $tsm.reorder([2, 3, 0, 1], 4)).toEqual('@pole[4] is not found!');
        expect2(() => $tsm.reorder([2, 3, 0, 1], 0)).toEqual([0, 1, 2, 3]);
        expect2(() => $tsm.reorder([2, 1, 0, 3], 0)).toEqual([0, 1, 2, 3]); // same route of [0, 1, 3, 5], but ordering.
        expect2(() => $tsm.reorder([2, 3, 0, 1], 3)).toEqual([3, 0, 1, 2]);
        expect2(() => $tsm.reorder([2, 3, 0, 1], 1)).toEqual([1, 0, 3, 2]);
        expect2(() => $tsm.reorder([2, 3, 0, 1], 0, true)).toEqual([3, 2, 1, 0]);

        //! test fitness()
        expect2(() => $tsm.fitness({ sol: [0, 1] })).toEqual(DIST_0_TO_1 * 2);

        //! test randomSol();
        expect2(() => $tsm.randomSol(2, i => i)).toEqual({ fit: 0, sol: [0, 1] });
        expect2(() => $tsm.randomSol(3, i => i)).toEqual({ fit: 0, sol: [0, 1, 2] });
        expect2(() => $tsm.randomSol(4, i => -i)).toEqual({ fit: 0, sol: [3, 2, 1, 0] });

        //! test selection();
        const pops: Solution[] = [
            { fit: 2, sol: [] },
            { fit: 1, sol: [] },
            { fit: 4, sol: [] },
            { fit: 0, sol: [] },
            { fit: 3, sol: [] },
        ];
        expect2(() => $tsm.selection(pops, 2, i => i)).toEqual({ ...pops[3] });
        expect2(() => $tsm.selection(pops, 2, i => -i)).toEqual({ ...pops[1] });
        expect2(() => $tsm.selection(pops, 3, i => i)).toEqual({ ...pops[3] });
        expect2(() => $tsm.selection(pops, 3, i => -i)).toEqual({ ...pops[1] });

        //! test crossover();;
        const $sol2: Solution = { sol: [2, 1, 4, 0, 3] };
        expect2(() => $tsm.crossover($sol2, i => (!i ? 2 : 2))).toEqual({ fit: 0, sol: [2, 1, 3, 0, 4] });
        expect2(() => $tsm.crossover($sol2, i => (!i ? 0 : 0))).toEqual({ fit: 0, sol: [3, 0, 4, 1, 2] });
        expect2(() => $tsm.crossover($sol2, i => (!i ? 1 : 1))).toEqual({ fit: 0, sol: [2, 3, 0, 4, 1] });
        expect2(() => $tsm.crossover($sol2, i => (!i ? 1 : 4))).toEqual({ fit: 0, sol: [2, 0, 4, 1, 3] });
        expect2(() => $tsm.crossover($sol2, i => (!i ? 4 : 1))).toEqual({ fit: 0, sol: [2, 0, 4, 1, 3] });
        expect2(() => $tsm.crossover($sol2, i => (!i ? 1 : 5))).toEqual({ fit: 0, sol: [2, 3, 0, 4, 1] });
        expect2(() => $sol2).toEqual({ sol: [2, 1, 4, 0, 3] });

        //! test crossover2();;
        const $sol2A: Solution = { sol: [2, 1, 4, 0, 3] };
        const $sol2B: Solution = { sol: [4, 3, 0, 2, 1] };
        expect2(() => $tsm.crossover2($sol2A, $sol2B, i => [0][i]), 'A').toEqual('@x[0] is out of range[1,4]');
        expect2(() => $tsm.crossover2($sol2A, $sol2B, i => [1][i]), 'A').toEqual({ A: [2, 3, 0, 1, 4] });
        expect2(() => $tsm.crossover2($sol2A, $sol2B, i => [2][i]), 'A').toEqual({ A: [2, 1, 0, 4, 3] });
        expect2(() => $tsm.crossover2($sol2A, $sol2B, i => [3][i]), 'A').toEqual({ A: [2, 1, 4, 3, 0] });
        expect2(() => $tsm.crossover2($sol2A, $sol2B, i => [4][i]), 'A').toEqual({ A: [2, 1, 4, 0, 3] });
        expect2(() => $tsm.crossover2($sol2A, $sol2B, i => [5][i]), 'A').toEqual('@x[5] is out of range[1,4]');

        expect2(() => $tsm.crossover2($sol2A, $sol2B, i => [2][i]), 'A').toEqual({ A: [2, 1, 0, 4, 3] });
        expect2(() => $tsm.crossover2($sol2A, $sol2B, i => [2][i]), 'B').toEqual({ B: [4, 0, 3, 2, 1] });
        expect2(() => $tsm.crossover2($sol2A, $sol2B, i => [2][i]), 'C').toEqual({ C: [4, 3, 0, 2, 1] });
        expect2(() => $tsm.crossover2($sol2A, $sol2B, i => [2][i]), 'D').toEqual({ D: [0, 2, 1, 4, 3] });

        //! test move2();
        const $sol3: Solution = { sol: [2, 1, 4, 0, 3] };
        expect2(() => $tsm.move2($sol3, i => [0, 0, 0][i])).toEqual({ fit: 0, sol: [2, 1, 4, 0, 3] });
        expect2(() => $tsm.move2($sol3, i => [4, 4, 4][i])).toEqual({ fit: 0, sol: [2, 1, 4, 0, 3] });
        expect2(() => $tsm.move2($sol3, i => [2, 2, 2][i])).toEqual({ fit: 0, sol: [2, 1, 4, 0, 3] });
        expect2(() => $tsm.move2($sol3, i => [2, 1, 2][i])).toEqual({ fit: 0, sol: [2, 4, 1, 0, 3] });
        expect2(() => $tsm.move2($sol3, i => [1, 3, 2][i])).toEqual({ fit: 0, sol: [2, 0, 1, 4, 3] });
        expect2(() => $tsm.move2($sol3, i => [1, 3, 3][i])).toEqual({ fit: 0, sol: [2, 0, 1, 4, 3] });
        expect2(() => $tsm.move2($sol3, i => [1, 3, 0][i])).toEqual({ fit: 0, sol: [1, 4, 2, 0, 3] });
        expect2(() => $sol3).toEqual({ sol: [2, 1, 4, 0, 3] });

        //! test mutate();
        expect2(() => $tsm.mutate({ sol: [2, 1, 4, 0] }, 0.1, () => 1)).toEqual({ fit: 0, sol: [2, 1, 4, 0] }); // no change
        expect2(() => $tsm.mutate({ sol: [2, 1, 4, 0] }, 0.1, () => 0)).toEqual({ fit: 0, sol: [2, 4, 1, 0] }); // always.
        expect2(() => $tsm.mutate({ sol: [2, 1, 4, 0, 3] }, 0.1, () => 1)).toEqual({ fit: 0, sol: [2, 1, 4, 0, 3] }); // no change
        expect2(() => $tsm.mutate({ sol: [2, 1, 4, 0, 3] }, 0.1, () => 0)).toEqual({ fit: 0, sol: [2, 4, 1, 3, 0] }); // always.

        //! test cleanup();
        /* eslint-disable prettier/prettier */
        const pops2: Solution[] = [[1,2],[3,4],[1,3],[3,4],[2,5],[1,3]].map((sol, i) => ({fit:i, sol}));
        expect2(() => $tsm.cleanup(pops2).map(_ => _.fit)).toEqual([0, 1, 2, 4]);
        expect2(() => $tsm.cleanup(pops2).map(_ => _.sol)).toEqual([[1,2], [3,4], [1,3], [2,5]]);
        /* eslint-enable prettier/prettier */

        //! test find() from grid
        const samples: number[][] = ['1,0,0', '2,1,1', '3,1,0', '4,0,1'].map(_ => _.split(',').map(_ => $U.N(_)));
        const $tsm2 = new TravelingSalesMan(samples);
        $tsm2.$best.name = 'data/best-spec.json';
        expect2(() => $tsm2.travels([0, 2, 1, 3])).toEqual(1 * 4);
        expect2(() => $tsm2.travels([0, 2, 1, 3].reverse())).toEqual(1 * 4);
        expect2(() => $tsm2.find(10, 50)).toEqual({ fit: 4, sol: [0, 2, 1, 3] });
        expect2(() => $tsm2.find(10, 50)).toEqual({ fit: 4, sol: [0, 2, 1, 3] });
        expect2(() => $tsm2.find(10, 50)).toEqual({ fit: 4, sol: [0, 2, 1, 3] });

        expect2(() => $tsm2.findRoute(10, 50)).toEqual({ cost: 4, route: [1, 3, 2, 4] });
    });
});
