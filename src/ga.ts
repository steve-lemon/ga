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

export const range = (a: number, b?: number): number[] => $_.range(a, b);

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
        _err(`! err-read(${name}) =`, e);
        if (def) def.error = `${e.message || e}`;
        return def;
    }
};

//! save json in sync.
export const saveJsonSync = (name: string, data: any = {}) => {
    name = !name.startsWith('./') ? `./${name}` : name;
    try {
        const json = typeof data == 'string' ? data : JSON.stringify(data, null, 4);
        return fs.writeFileSync(name, json, 'utf8');
    } catch (e) {
        _err(`! err-save(${name}) =`, e);
        return null;
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
 * get euklidian distance between a & b
 * @param a     from a
 * @param b     to b
 */
export const distance = (a: City, b: City) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));

/**
 * class: `TravelingSalesMan`
 * - to solve traveling-salesman-problem.
 */
export class TravelingSalesMan {
    /**
     * list of cities
     */
    public readonly cities: City[];
    /**
     * distance metrics cities[i] <-> cities[j]
     */
    public readonly metrics: number[][];

    /**
     * default constructor
     * @param nodes    list of position info of node
     */
    public constructor(nodes: number[][]) {
        this.cities = TravelingSalesMan.transform(nodes);
        this.metrics = TravelingSalesMan.buildMetrics(this.cities);
        _inf(`TravelingSalesMan([${nodes.length}][${nodes[0].length}])`);
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
     *
     * @param cities
     */
    public static buildMetrics = (cities: City[]): number[][] =>
        range(cities.length).map(i => range(cities.length).map(j => distance(cities[i], cities[j])));

    /**
     * get euklidian distance between a & b
     */
    public distance = (a: City, b: City): number => distance(a, b);

    /**
     * using lookup metrics to get distance.
     */
    public distByIndex = (i: number, j: number) =>
        i < this.cities.length && j < this.cities.length ? this.metrics[i][j] : 0;

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
                // const A = this.cities[a];
                // const B = this.cities[b];
                // return A && B ? this.distance(A, B) : 0;
                return this.distByIndex(a, b);
            })
            .reduce((T, d) => T + d, 0);

    /**
     * re-ordering by pole
     */
    public reorder = (indices: number[], pole: number = 0, reverse?: boolean) => {
        const i = indices.indexOf(pole);
        if (i < 0) throw new Error(`@pole[${pole}] is not found!`);
        //! determine direction.
        const at = (i: number) =>
            i >= indices.length ? indices[i - indices.length] : i < 0 ? indices[i + indices.length] : indices[i];
        const [left, right] = [at(i - 1), at(i + 1)]; //! left & right.
        let A = indices.slice(i).concat(indices.slice(0, i));
        if (right > left) A = [A[0]].concat(A.slice(1).reverse());
        return reverse ? A.reverse() : A;
    };

    /**
     * fitness of solution.sol
     * @param sol
     */
    public fitness = (sol: Solution) => this.travels(sol.sol);

    /**
     * get randomize solution (indices) by len
     * @param rnd  (optional) custom random function.
     */
    public randomSol = (len: number, rnd?: (i: number) => number): Solution => ({
        fit: 0,
        sol: range(len)
            .map(i => ({ i, r: rnd ? rnd(i) : random.random() }))
            .sort((a, b) => a.r - b.r) // order by asc
            .map(_ => _.i),
    });

    /**
     * tournament select solution from populations in k-group
     * @param pops list of population
     * @param k    k-group
     * @param rnd  (optional) custom random function.
     */
    public selection = (pops: Solution[], k: number, rnd?: (i: number) => number): Solution =>
        pops
            .map((p, i) => ({ p, i: rnd ? rnd(i) : random.random() }))
            .sort((a, b) => b.i - a.i) // order by desc
            .map(_ => _.p)
            .slice(0, k)
            .sort((a, b) => a.fit - b.fit) // order by asc
            .slice(0, 1)[0];

    /**
     * crossover for round ring array.
     */
    public crossover = ($sol: Solution, rnd?: (i: number) => number): Solution => {
        const { sol: org } = $sol;
        const len = org.length;
        const cut = rnd ? rnd(len) : random.randint(1, len - 1);
        //WARN! same fit due to ring..
        // const sol = org.slice(0, cut).concat(org.slice(cut));
        //NOTE - reverse the 2nd route.
        const sol = org.slice(0, cut).concat(org.slice(cut).reverse());
        return { fit: 0, sol };
    };

    /**
     * mutate solution.
     * - switch the pair within epsilon rate...
     */
    public mutate = ($sol: Solution, epsilon: number, rnd?: (i: number) => number): Solution => {
        rnd = rnd || (() => random.random());
        const { sol } = $sol;
        const LEN = sol.length;
        const len = Math.floor(LEN / 2);
        const off = rnd(0) < 0.5 ? 1 : 0; // offset..
        range(len).forEach(i => {
            const r = rnd(i);
            if (r < epsilon) {
                //! switch pair.
                const j = i * 2 + off;
                const L = sol.slice(j, j + 2);
                if (L.length == 2) {
                    const [a, b] = L;
                    sol[j] = b;
                    sol[j + 1] = a;
                }
            }
        });
        return { ...$sol, sol };
    };

    /**
     * save best to file.
     */
    public $best = {
        name: `data/best.json`,
        load: (): Solution => {
            const LEN = this.cities.length;
            const json = loadJsonSync(this.$best.name);
            const $def = (): Solution => {
                const $sol = this.randomSol(LEN);
                const fit = this.fitness($sol);
                const sol = this.reorder($sol.sol);
                return { fit, sol };
            };
            if (json.error) return $def();
            const sol = json as Solution;
            if (sol && sol.sol && sol.fit && sol.sol.length == LEN) return sol;
            return $def();
        },
        save: (best: Solution) => saveJsonSync(this.$best.name, best),
    };

    /**
     * find best route..
     *
     * @param popCount count of population
     * @param genCount count of generation
     */
    public find = (popCount: number, genCount: number): Solution => {
        const LEN = this.cities.length;
        const K = 8;
        const EPSILON = 2.0 / LEN;

        //! load the last best solution
        let best: Solution = this.$best.load();
        const best_fit = best.fit;

        //! initialise random population
        let population: Solution[] = range(popCount - 1)
            .map((): Solution => this.randomSol(LEN))
            .map($s => ({
                fit: this.fitness($s),
                sol: this.reorder($s.sol),
            }));
        population.push(best);

        //! loop until generations.
        for (let g = 0; g < genCount; g++) {
            const offsprings: Solution[] = [];
            while (offsprings.length < popCount) {
                const parent = this.selection(population, K);

                //! making offspring....
                let offspring = this.crossover(parent);
                offspring = this.mutate(offspring, EPSILON);
                offspring.sol = this.reorder(offspring.sol);
                offspring.fit = this.fitness(offspring);
                offsprings.push(offspring);
            }

            //! append offstring to pops
            population = population.concat(offsprings);
            population = population.sort((a, b) => a.fit - b.fit); //! order by asc

            //! cut-off...
            population = population.slice(0, popCount);
            if (population[0].fit < best.fit || !best.fit) {
                const best2 = population[0];
                const fn = (i: number) => Math.round(i * 100) / 100;
                _log(`! best-route@${g} :=\t`, fn(best2.fit), `\t d:${fn(best2.fit - best.fit)}`);
                best = best2;
            }
        }

        //! now save to best only if better.
        if (!best_fit || best_fit > best.fit) this.$best.save(best);

        //! returns..
        return best;
    };

    /**
     * find route by list of city
     */
    public findRoute = (popCount: number, genCount: number): { cost: number; route: number[] } => {
        const best = this.find(popCount, genCount);
        const { fit, sol } = best;
        const cities = sol.map(i => this.cities[i]).map((c, i) => c.i || i);
        // _inf(`! routes =`, cities.join(', '));
        return { cost: fit, route: cities };
    };
}
