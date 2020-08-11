/**
 * file: `ga-tree.ts`
 * - genetic algorithm for json-tree op
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-08-10 initial version.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { $U, _log, _inf, _err } from 'lemon-core';
const NS = $U.NS('gtree', 'blue');

/**
 * score of current node (or leaf).
 * - node -[branch]-> node (or leaf).
 */
export interface GATreeScore {
    /**
     * matched node count (both has node)
     */
    n?: number;
    /**
     * matched leaf count (leaf is like string, number)
     */
    l?: number;
    /**
     * total childs
     */
    t?: number;
    /**
     * max depth.
     */
    d?: number;
}

export const score = (left: any, right: any, branch?: string, depth?: number): GATreeScore => {
    depth = depth || 0;
    const t1 = typeof left;
    const t2 = typeof right;

    //! check leaf condition.
    if (t2 == 'object') {
        if (right === null) throw new Error(`@${branch || ''}.right[${right}] is invalid!`);
        if (Array.isArray(right)) throw new Error(`@${branch || ''}.right[${depth}] is array!`);
        if (Array.isArray(left)) throw new Error(`@${branch || ''}.left[${depth}] is array!`);
        const Rs = Object.keys(right);
        const Ls = left && t1 == 'object' ? Object.keys(left) : [];
        const Out = Ls.filter(k => !Rs.includes(k));
        return Rs.map(key => score(left && left[key], right[key], key, depth + 1)).reduce(
            (R, S) => {
                R.n += S.n || 0;
                R.l += S.l || 0;
                R.t += S.t || 0;
                R.d = Math.max(R.d, S.d || 0);
                return R;
            },
            { n: 1, l: 0, t: 1 + Out.length, d: depth },
        );
    }
    if (left === right) return { l: 1, t: 1, d: depth };
    else return { l: 0, t: 1, d: depth };
};
