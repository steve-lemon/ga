/**
 * file: `index.ts`
 * - main index file
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-07-17 initial version.
 */
import fs from 'fs';

const _log = console.log;
const _err = console.error;

//! check if called directly...
const isDirectCall = require.main === module;

//! override environ...
if (isDirectCall) {
    // process.env = { ...process.env, LS: '1' }; // LS means log-silence.
}

//! import/export
import { main } from './main';
export * from './ga';

//! execute main function.
if (isDirectCall) {
    main(process.argv)
        .then($sol => {
            if ($sol) {
                _log($sol.cost);
                fs.writeFileSync('./solution.csv', $sol.route.join('\n') + '\n');
            }
        })
        .catch(e => {
            _err(e);
        });
}
