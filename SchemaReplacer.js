console.time('Time to generate CQL files');

const schemas = require('./src/OldSchemas/Schemas');
const fs = require('fs/promises');
const path = require('path');
const PathToCqlFiles = path.join(__dirname, 'src', 'cql');

const clearInArgs = process.argv.includes('--clear');
const dryRun = process.argv.includes('--dry');
const clearExtraNewLines = process.argv.includes('--clear-extra-new-lines');

const Main = async () => {
    console.log('='.repeat(80));

    if (clearInArgs) {
        const files = await fs.readdir(PathToCqlFiles);

        for (const file of files) {
            await fs.unlink(path.join(PathToCqlFiles, file));
        }
    }

    for (const schema of Object.keys(schemas)) {
        const { CqlTable, Indexes, Types } = schemas[schema];

        console.time(`Time to generate ${schema}.cql`);

        if (dryRun) {
            console.log(CqlTable);
            console.log(Indexes.join('\n'));
            console.log(Types.join('\n'));

            continue;
        }

        await fs.writeFile(path.join(PathToCqlFiles, `${schema}.cql`), '');
        await fs.appendFile(path.join(PathToCqlFiles, `${schema}.cql`), `${Types.length > 0 ? Types.join('\n') : ''}`);
        await fs.appendFile(path.join(PathToCqlFiles, `${schema}.cql`), `${Types.length > 0 ? '\n' : ''}${CqlTable}\n`);
        await fs.appendFile(path.join(PathToCqlFiles, `${schema}.cql`), `${Indexes.length > 0 ? '\n' : ''}${Indexes.join('\n')}\n`);

        if (clearExtraNewLines) {
            const file = await fs.readFile(path.join(PathToCqlFiles, `${schema}.cql`), 'utf8');

            const lines = file.split('\n');
            const newLines = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                if (line === '') {
                    if (lines[i - 1] === '' || lines[i + 1] === '') {
                        lines.splice(i, 1);
                    }
                }

                newLines.push(line);
            }

            await fs.writeFile(path.join(PathToCqlFiles, `${schema}.cql`), newLines.join('\n'));
        }

        console.timeEnd(`Time to generate ${schema}.cql`);
    }

    console.log('='.repeat(80));

    console.timeEnd('Time to generate CQL files');
};


Main();
