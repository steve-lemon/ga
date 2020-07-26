# Project: GA

Genetic Algorithm experimental

- solving TST(Travelling Salesman Problem) by using GA.


## How To Run

* install the required modules

    ```sh
    $ npm install
    ```

* run GA to find TSP (see `Run Arguments` Section)

    ```sh
    #WARN! must add '--' for arguments.
    $ npm start -- -p 20 -f 200 burma14.tsp
    ```


### Run Arguments

| Name      | Description |
|--         |--  |
| p         | Number of population per each generation |
| f         | Budget count of fitness |


## How Works

**[Overview]**

1. read `.tsp` file, and build distance map between each points.
1. make random population with `randomSol()`
1. [Elitism] make offsprings from `best` solution.
1. select 2 parents by tournament.
1. make crossover at random position.
1. make offsprings by 4 combination, and mutate.
1. add offsprings to population, and remove the duplicated.
1. sort by `fitness`, then cut-off population.
1. find the best solution.


## Crossover

- exchange the range of route with the different position.


### Self Crossover

select the random range from A to B, then reverse the range.

```ts
    public crossover = ($sol: Solution, rnd?: (i: number) => number): Solution => {
        const { sol: org } = $sol;
        const LEN = org.length;
        const a = rnd ? rnd(0) : random.randint(1, LEN - 1);
        const b = rnd ? rnd(1) : random.randint(1, LEN - 1);
        const [A, B] = [a, b].sort();
        const sol =
            A >= B
                ? org.slice(0, A).concat(org.slice(A).reverse())
                : org
                        .slice(0, A)
                        .concat(org.slice(A, B).reverse())
                        .concat(org.slice(B));
        return { fit: 0, sol };
    };
```


### Mate Crossover

select the random position, then swap between 2 solutions.

```ts
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
        return { A, B, C, D };
    };
```

### Mutate

swap by neighbor pairs with `epsilon` probability. 

```ts
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
```


## LICENSE

[MIT](http://opensource.org/licenses/MIT)
