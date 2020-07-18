/**
 * file: `index.ts`
 * - main index file
 *
 * @author      Steve <steve@lemoncloud.io>
 * @date        2020-07-17 initial version.
 */
const _log = console.log;

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
    _log('! run main()....');
    main(process.argv);
}
