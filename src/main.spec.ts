/**
 * file: `main.spec.ts`
 * - spec for functions in main
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-07-17 initial version.
 */
import { expect2 } from 'lemon-core';
import { normalizeArguments, downloadFile, packArguments } from './main';

describe('main', () => {
    it('should pass all', async done => {
        expect2(() => 1).toEqual(1);

        const argv1 = 'npm start -p 12 -f 13 abc.tsp'.split(' ');
        const argv2 = 'npm start -pop 12 -fit 13 -name abc.tsp'.split(' ');
        const argv3 = 'node . -pop 12 -name abc.tsp'.split(' ');
        expect2(() => normalizeArguments([...argv1])).toEqual([...argv2, '-ext', '0']);
        expect2(() => normalizeArguments([...argv2])).toEqual([...argv2]);
        expect2(() => normalizeArguments([...argv3])).toEqual([...argv3]);

        // eslint-disable-next-line prettier/prettier
        const param0 = { ext: 0, name: 'abc.tsp', pop: 20, fit: -1, gen: 50, epo: 50, gap: 1, min: 0, max: 1, deep: 0, short: 0 };
        const na = (a: string[], b?: string) => normalizeArguments([...a, ...((b && b.split(' ')) || [])]);
        const pa = (c: string) => packArguments(na([], c));
        expect2(() => pa('npm start')).toEqual('-name (or tsp-file) is required!');
        expect2(() => pa('npm start abc.tsp')).toEqual('-pop (or -p) is required!');
        expect2(() => pa('npm start -p 20 abc.tsp')).toEqual('-fit (or -f) is required!');
        expect2(() => pa('npm start -p 20 -f 5 abc.tsp')).toEqual({ ...param0, epo: 1, fit: 5, gen: 0 });
        expect2(() => pa('npm start -pop 20 -fit 5 abc.tsp')).toEqual({ ...param0, epo: 1, fit: 5, gen: 0 });
        expect2(() => pa('npm start -pop 20 -fit 5 -name abc.tsp')).toEqual({ ...param0, ext: 1, fit: 5 });
        expect2(() => pa('npm start -pop 25 -name abc.tsp')).toEqual({ ...param0, ext: 1, pop: 25 });
        expect2(() => pa('npm start -name abc.tsp')).toEqual({ ...param0, ext: 1 });

        expect2(await downloadFile('bier127')).toEqual('./data/bier127.tsp');
        expect2(await downloadFile('bier127.tsp')).toEqual('./data/bier127.tsp');

        done();
    });
});
