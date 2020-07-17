import { fitness, random_solution, selection, crossover, find } from './ga';

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
        expect(find(10, 50)).toEqual({ fit: 4, sol: [1, 3, 4, 5] });
    });
});
