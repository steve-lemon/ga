/**
 * file: `ga.ts`
 * - function for ga
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-07-17 initial version.
 */
import { _log, _inf, _err, $U, $_ } from 'lemon-core';
import fs from 'fs';
const NS = $U.NS('ga', 'blue');

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

        _log(NS, `! best@${g} =`, best);
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
        _err(NS, `! err-read(${name}) =`, e);
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
        _err(NS, `! err-save(${name}) =`, e);
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
        _err(NS, `! fail to open-file: ${name} =`, e);
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
     * - use 2 point [A, B] to cut & swap
     */
    public crossover = ($sol: Solution, rnd?: (i: number) => number): Solution => {
        const { sol: org } = $sol;
        const LEN = org.length;
        const a = rnd ? rnd(0) : random.randint(1, LEN - 1);
        const b = rnd ? rnd(1) : random.randint(1, LEN - 1);
        const [A, B] = [a, b].sort();
        //NOTE - reverse the cut routes.
        const sol =
            A >= B
                ? org.slice(0, A).concat(org.slice(A).reverse())
                : org
                      .slice(0, A)
                      .concat(org.slice(A, B).reverse())
                      .concat(org.slice(B));
        if (LEN != sol.length) throw new Error(`.len[${LEN}] is diff@crossover: ${[A, B]}`);
        return { fit: 0, sol };
    };

    /**
     * mate and crossover two parents
     */
    public crossover2 = (p1: Solution, p2: Solution, rnd?: (i: number) => number) => {
        const { sol: org } = p1;
        const LEN = org.length;
        const x = rnd ? rnd(0) : random.randint(1, LEN - 1);
        if (x < 1 || x > LEN - 1) throw new Error(`@x[${x}] is out of range[1,${LEN - 1}]`);
        const [a, b] = [p1.sol.slice(0, x), p1.sol.slice(x)];
        const [c, d] = [p2.sol.slice(0, x), p2.sol.slice(x)];
        const A = a.concat(d.filter(i => !a.includes(i))).concat(c.filter(i => !a.includes(i)));
        const B = b.concat(c.filter(i => !b.includes(i))).concat(d.filter(i => !b.includes(i)));
        const C = c.concat(b.filter(i => !c.includes(i))).concat(a.filter(i => !c.includes(i)));
        const D = d.concat(a.filter(i => !d.includes(i))).concat(b.filter(i => !d.includes(i)));
        if (A.length != LEN) throw new Error(`.len[${LEN}] is diff@cross2 A:${[A.length]}`);
        if (B.length != LEN) throw new Error(`.len[${LEN}] is diff@cross2 B:${[B.length]}`);
        if (C.length != LEN) throw new Error(`.len[${LEN}] is diff@cross2 C:${[C.length]}`);
        if (D.length != LEN) throw new Error(`.len[${LEN}] is diff@cross2 D:${[D.length]}`);
        return { A, B, C, D };
    };

    /**
     * cut and move to random poz
     */
    public move2 = ($sol: Solution, rnd?: (i: number) => number): Solution => {
        const { sol: org } = $sol;
        const LEN = org.length;
        const a = rnd ? rnd(0) : random.randint(1, LEN - 1);
        const b = rnd ? rnd(1) : random.randint(1, LEN - 1);
        const [A, B] = a < b ? [a, b] : [b, a];
        const c = rnd ? rnd(2) : random.randint(0, LEN - (B - A) - 1);
        const tmp = org.slice(0, A).concat(org.slice(B));
        const C = c < 0 ? 0 : c >= tmp.length ? tmp.length - 1 : c;
        const sol = tmp
            .slice(0, C)
            .concat(org.slice(A, B))
            .concat(tmp.slice(C));
        if (LEN != sol.length) throw new Error(`.len[${LEN}] is diff@move2: ${[A, B, C]}`);
        return { fit: 0, sol };
    };

    /**
     * mutate solution.
     * - switch the pair within epsilon rate...
     */
    public mutate = ($sol: Solution, epsilon: number, rnd?: (i: number) => number): Solution => {
        rnd = rnd || (() => random.random());
        const { sol: org } = $sol;
        const sol = [...org];
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
        return { fit: 0, sol };
    };

    /**
     * cleanup the duplicated one.
     * @param pops list of population.
     */
    public cleanup = (pops: Solution[]): Solution[] => {
        const maps = pops.map(_ => _.sol.join(':'));
        return pops.map((_, i) => (maps.indexOf(maps[i]) < i ? null : _)).filter(_ => !!_);
    };

    /**
     * save best to file.
     */
    public $best = {
        name: `data/best.json`,
        last: null as Solution,
        load: (): Solution => {
            const LEN = this.cities.length;
            const json = this.$best.last ? this.$best.last : loadJsonSync(this.$best.name);
            const $def = (): Solution => {
                const $sol = this.randomSol(LEN);
                const fit = this.fitness($sol);
                const sol = this.reorder($sol.sol);
                _inf(NS, `! make random best(${fit})...`);
                return { fit, sol };
            };
            if (!json || json.error) {
                _err(NS, `! err in json =`, json.error);
                return $def();
            }
            const sol = json as Solution;
            if (sol && sol.sol && sol.fit && sol.sol.length == LEN) {
                return { fit: sol.fit, sol: [...sol.sol] };
            }
            _inf(NS, `! WARN! invalid-best(fit:${sol.fit},len:${sol.sol.length} vs ${LEN})`);
            return $def();
        },
        save: (best: Solution) => {
            if (!best.fit || best.fit <= 0) return best;
            const LAST_FIT = this.$best.last ? this.$best.last.fit : 0;
            this.$best.last = { fit: best.fit, sol: [...best.sol] };
            if (LAST_FIT != best.fit) {
                _inf(NS, `! save last-best(${best.fit})...`);
                saveJsonSync(this.$best.name, best);
            }
            return best;
        },
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
        const $last = { best: this.$best.load() };

        //! operators
        const fitness = (sol: Solution) => ({ fit: this.fitness(sol), sol: this.reorder(sol.sol) });
        const crossover = (sol: Solution) => this.crossover(sol);
        const crossover2 = (p1: Solution, p2: Solution) => this.crossover2(p1, p2);
        const mutate = (sol: Solution, r: number = 1) => this.mutate(sol, EPSILON * r);
        const move = (sol: Solution) => this.move2(sol);

        //! initialise random population w/ best
        let population: Solution[] = range(popCount - 0)
            .map(i => (i < 4 ? $last.best : this.randomSol(LEN)))
            .map($s => fitness($s));

        //! loop until generations.
        for (let g = 0; g < genCount; g++) {
            //! init offspring with best's mutants
            const offsprings: Solution[] = range(4).map(i => {
                const b = crossover($last.best);
                const c = mutate(move(b), i % 2);
                return fitness(c);
            });

            //! gen more...
            while (offsprings.length < popCount) {
                //! select pairs..
                const par1 = this.selection(population, K);
                const par2 = this.selection(population, K);

                //! make offsprings.
                offsprings.push(fitness(mutate(crossover(par1))));
                offsprings.push(fitness(mutate(move(par2))));

                //! cross paires.
                const { A, B, C, D } = crossover2(par1, par2);
                offsprings.push(fitness(mutate({ fit: 0, sol: A })));
                offsprings.push(fitness(mutate({ fit: 0, sol: B })));
                offsprings.push(fitness(mutate({ fit: 0, sol: C })));
                offsprings.push(fitness(mutate({ fit: 0, sol: D })));
            }

            //! append offstrings into pops.
            population = population.concat(offsprings);

            //! remove the duplicated pops.
            if (!(g % 10)) population = this.cleanup(population);

            //! order by .fit asc
            population = population.sort((a, b) => a.fit - b.fit);

            //! cut-off by pop-count.
            population = population.slice(0, Math.min(popCount, population.length));

            //! estimate the best fit.
            if (population[0].fit < $last.best.fit) {
                const $old = $last.best;
                const $new = population[0];
                const fn = (i: number) => Math.round(i * 100) / 100;
                _log(NS, `! best-route@${g} :=\t`, fn($new.fit), `\td:${fn($new.fit - $old.fit)} \t<-${fn($old.fit)}`);
                $last.best = { fit: $new.fit, sol: [...$new.sol] };
                //! check if best has zero fit.
                if (!$last.best.fit) throw new Error(`.fit is invalid! - sol:${$last.best.sol}`);
            }
        }

        //! now save to best only if better.
        return this.$best.save($last.best);
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
