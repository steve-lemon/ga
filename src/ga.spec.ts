/**
 * file: `ga.spec.ts`
 * - spec for ga
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-07-17 initial version.
 */
import { expect2 } from 'lemon-core';
import { fitness, random_solution, crossover, find, loaodTsp, TravelingSalesMan } from './ga';

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
        // eslint-disable-next-line prettier/prettier
        expect2(() => $tsm.travels([0, 1])).toEqual($tsm.distance({ i: 1, x: 9860, y: 14152 }, { i: 2, x: 9396, y: 14616 }));
        // eslint-disable-next-line prettier/prettier
        expect2(() => $tsm.travels([1, 0])).toEqual($tsm.distance({ i: 1, x: 9860, y: 14152 }, { i: 2, x: 9396, y: 14616 }));
        const inOrder = Array.from(Array(127)).map((_, i) => i);
        expect2(() => inOrder.length).toEqual(127);
        expect2(() => inOrder.slice(0, 3)).toEqual([0, 1, 2]);
        expect2(() => inOrder.slice(125)).toEqual([125, 126]);
        expect2(() => Math.round($tsm.travels(inOrder) * 100)).toEqual(393998.28 * 100);
    });
});
