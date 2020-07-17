import { expect2, loadDataYml } from 'lemon-core';
import { fitness, random_solution, crossover, find, loaodTsp } from './ga';

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
        expect2(() => find(10, 50)).toEqual({ fit: 4, sol: [1, 3, 4, 5] });
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
});
