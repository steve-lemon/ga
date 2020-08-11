/**
 * file: `ga-tree.spec.ts`
 * - spec for `ga-tree`
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-07-17 initial version.
 */
import { expect2 } from 'lemon-core';
import { score } from './ga-tree';

describe('ga-tree', () => {
    it('should pass all', () => {
        expect2(() => 1).toEqual(1);
        expect2(() => typeof null).toEqual('object');
        expect2(() => typeof {}).toEqual('object');
        expect2(() => typeof []).toEqual('object');
        expect2(() => typeof undefined).toEqual('undefined');
        expect2(() => typeof 1).toEqual('number');
        expect2(() => typeof '').toEqual('string');
        expect2(() => typeof true).toEqual('boolean');
        expect2(() => typeof (() => 1)).toEqual('function');
    });

    it('should pass fitness()', () => {
        const check = (a: any, b: any) => expect2(() => score(a, b));
        check(1, 1).toEqual({ l: 1, t: 1, d: 0 });
        check(1, 0).toEqual({ l: 0, t: 1, d: 0 });
        check(0, 1).toEqual({ l: 0, t: 1, d: 0 });

        /* eslint-disable prettier/prettier */
        check({ A: 0 }, { A: 1 }                ).toEqual({ n: 1, l: 0, t: 2, d: 1 }); // root + branch:1
        check({ A: 1 }, { A: 1 }                ).toEqual({ n: 1, l: 1, t: 2, d: 1 });
        check({ A: 1 }, { A: { B: 1 } }         ).toEqual({ n: 2, l: 0, t: 3, d: 2 });

        check({ A: { B: 1 } }, { A: { B: 1 } }  ).toEqual({ n: 2, l: 1, t: 3, d: 2 });
        check({ A: { B: 1 } }, { A: 1 }         ).toEqual({ n: 1, l: 0, t: 2, d: 1 }); //! same branch, but leaf : 1/2 = 0.5
        check({ B: { A: 1 } }, { A: 1 }         ).toEqual({ n: 1, l: 0, t: 3, d: 1 }); //! branch diff : 1/3 = 0.33

        //! not matched at all
        check(true              , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 2, d: 1 });
        check(null              , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 2, d: 1 });
        check(undefined         , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 2, d: 1 });
        check(2                 , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 2, d: 1 });
        check(''                , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 2, d: 1 });

        //! branch 'A' matched
        check({ A: true }       , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 2, d: 1 });
        check({ A: null }       , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 2, d: 1 });
        check({ A: undefined }  , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 2, d: 1 });
        check({ A: 2 }          , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 2, d: 1 });
        check({ A: '' }         , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 2, d: 1 });

        //! branch 'B' differ.
        check({ B: true }       , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 3, d: 1 });
        check({ B: null }       , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 3, d: 1 });
        check({ B: undefined }  , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 3, d: 1 });
        check({ B: 1 }          , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 3, d: 1 });
        check({ B: '' }         , { A: 1 }      ).toEqual({ n: 1, l: 0, t: 3, d: 1 });
        /* eslint-disable prettier/prettier */
    });
});
