/**
 * file: `ga.ts`
 * - function for ga
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-07-17 initial version.
 */
import { _log, _inf, _err, $U, $_ } from 'lemon-core';
import fs from 'fs';
// const _log = console.log;
// const _inf = console.info;
// const _err = console.error;

export interface Solution {
    fit?: number;
    sol: number[];
}

export interface TspInfo {
    name?: string;
    comment?: string;
    type?: string;
    dimension?: number;
    edge_weight_type?: string;
    nodes: number[][];
}

const SECRET = [1, 0, 4, 9];
const SECRET_LET = SECRET.length;

const random = {
    randint: (a: number, b: number): number => {
        let x = Math.random() * (b - a) + a;
        return Math.floor(x);
    },
    random: () => Math.random(),
};

export const fitness = (sol: Solution, sec?: number[]) => {
    sec = sec || SECRET;
    const fits = sec.map((c, i) => (c == sol.sol[i] ? 1 : 0)).filter(_ => _ && _);
    return fits.length;
};

export const random_solution = (len: number): Solution => {
    // const sol = Array.from(Array(len)).map(_ => random.randint(0, 10));
    // const sol = [...Array(len).keys()].map(() => random.randint(0, 10));
    const sol = $_.range(len).map(() => random.randint(0, 10));
    return { fit: 0, sol };
};

export const selection = (pops: Solution[], k: number): Solution => {
    let list = pops
        .map(p => ({ p, i: Math.random() }))
        .sort((a, b) => b.i - a.i)
        .map(_ => _.p)
        .slice(0, k);
    list = list.sort((a, b) => b.fit - a.fit);
    return list[0];
};

export const crossover = (p1: Solution, p2: Solution, cut?: number): { off1: Solution; off2: Solution } => {
    cut = cut || random.randint(1, p1.sol.length - 1);
    const o1 = p1.sol.slice(0, cut).concat(p2.sol.slice(cut));
    const o2 = p2.sol.slice(0, cut).concat(p1.sol.slice(cut));
    return { off1: { sol: o1 }, off2: { sol: o2 } };
};

export const mutate = (solution: Solution, rate: number): Solution => {
    const sol = solution.sol.map(_ => (random.random() < rate ? random.randint(0, 10) : _));
    return { sol };
};

export const find = (pop: number, gen: number): Solution => {
    // initialise random population
    let population: Solution[] = $_.range(pop).map(() => {
        const sol = random_solution(SECRET_LET);
        sol.fit = fitness(sol);
        return sol;
    });

    let best: Solution = { fit: 0, sol: [] };
    for (let g = 0; g < gen; g++) {
        const offspring: Solution[] = [];
        while (offspring.length < pop) {
            const parent1 = selection(population, 4);
            const parent2 = selection(population, 4);
            let { off1, off2 } = crossover(parent1, parent2);

            off1 = mutate(off1, 0.1);
            off2 = mutate(off2, 0.1);

            off1.fit = fitness(off1);
            off2.fit = fitness(off2);

            offspring.push(off1);
            offspring.push(off2);
        }
        //! append offstring to pops
        population = population.concat(offspring);
        population = population.sort((a, b) => b.fit - a.fit);

        //! cut-off
        population = population.slice(0, pop);
        if (population[0].fit > best.fit) best = population[0];

        _log(`! best@${g} =`, best);
        if (best.fit >= SECRET_LET) break;
    }

    //! returns..
    return best;
};

//! load json in sync.
export const loadJsonSync = (name: string, def: any = {}) => {
    name = !name.startsWith('./') ? `./${name}` : name;
    try {
        const rawdata = fs.readFileSync(name);
        return JSON.parse(rawdata.toString());
    } catch (e) {
        if (def) def.error = `${e.message || e}`;
        return def;
    }
};

export const loaodTsp = (name: string): TspInfo => {
    name = !name.startsWith('./') ? `./data/${name}${name.endsWith('.tsp') ? '' : '.tsp'}` : name;
    try {
        const rawdata = fs.readFileSync(name).toString();
        const lines = rawdata.split(`\n`);
        let inData = false;
        const nodes: number[][] = [];
        const ret: TspInfo = { nodes };
        for (let i = 0; i < lines.length; i++) {
            const line = `${lines[i]}`.trim();
            if (line.startsWith('#')) continue;
            if (line == 'NODE_COORD_SECTION') inData = true;
            else if (line == 'EOF') inData = false;
            else if (inData) {
                const re = /([0-9]+)\s+([0-9]+)\s+([0-9]+)/.exec(line);
                if (re[0]) {
                    const node = re.slice(1).map(_ => Number.parseFloat(_));
                    nodes.push(node);
                }
            } else if (line.startsWith('NAME :')) ret.name = line.split(' : ', 2)[1];
            else if (line.startsWith('COMMENT :')) ret.comment = line.split(' : ', 2)[1];
            else if (line.startsWith('TYPE :')) ret.type = line.split(' : ', 2)[1];
            else if (line.startsWith('DIMENSION :')) ret.dimension = $U.N(line.split(' : ', 2)[1], 0);
            else if (line.startsWith('EDGE_WEIGHT_TYPE :')) ret.edge_weight_type = line.split(' : ', 2)[1];
        }
        return ret;
    } catch (e) {
        _err(`! fail to open-file: ${name} =`, e);
        throw e;
    }
};

/**
 * info of city.
 */
export interface City {
    i?: number;
    x: number;
    y: number;
}

/**
 * class: `TravelingSalesMan`
 * - to solve traveling-salesman-problem.
 */
export class TravelingSalesMan {
    public readonly cities: City[];
    /**
     * default constructor
     * @param nodes    list of position info of node
     */
    public constructor(nodes: number[][]) {
        this.cities = TravelingSalesMan.transform(nodes);
    }

    /**
     * transform number[][] to city[]
     */
    public static transform = (nodes: number[][]): City[] =>
        nodes.map((node, i) => {
            node = node || []; // prevent null error.
            if (node.length < 2) throw Error(`nodes[${i}].len[${node.length}] < 2`);
            const city = { i, x: 0, y: 0 };
            if (node.length < 3) {
                city.x = node[0];
                city.y = node[1];
            } else {
                city.i = node[0];
                city.x = node[1];
                city.y = node[2];
            }
            return city;
        });

    /**
     * get euklidian distance between a & b
     */
    public distance = (a: City, b: City) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));

    /**
     * travels each index, then get the total route distance.
     *
     * @param indices list of index in cities
     */
    public travels = (indices: number[]) =>
        indices
            .map((a, i) => {
                //! get previous city (or, the last one).
                const b = !i ? indices[indices.length - 1] : indices[i - 1]; //! point to the very first node if is last.
                const A = this.cities[a];
                const B = this.cities[b];
                return A && B ? this.distance(A, B) : 0;
            })
            .reduce((T, d) => T + d, 0);
}
