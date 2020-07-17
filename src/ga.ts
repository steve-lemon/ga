/**
 * file: `ga.ts`
 * - function for ga
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-07-17 initial version.
 */
const _log = console.log;
const _inf = console.info;

export interface Solution {
    fit?: number;
    sol: number[];
}

const secret = [1, 3, 4, 5];
const secret_len = secret.length;

const random = {
    randint: (a: number, b: number): number => {
        let x = Math.random() * (b - a) + a;
        return Math.floor(x);
    },
    random: () => Math.random(),
};

export const fitness = (sol: Solution, sec?: number[]) => {
    sec = sec || secret;
    const fits = sec.map((c, i) => (c == sol.sol[i] ? 1 : 0)).filter(_ => _ && _);
    return fits.length;
};

export const random_solution = (len: number): Solution => {
    const sol = Array.from(Array(len)).map(_ => random.randint(0, 10));
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
    let population: Solution[] = Array.from(Array(pop)).map(_ => {
        const sol = random_solution(secret_len);
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
        if (best.fit == secret_len) break;
    }

    //! returns..
    return best;
};
