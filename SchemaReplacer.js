const schemas = require('./OldSchemas/');
const fs = require('fs');
const path = require('path');
const PathToCqlFiles = path.join(__dirname, 'cql');

const clearInArgs = process.argv.includes('--clear');
const dryRun = process.argv.includes('--dry');
const removeExtraNewLines = process.argv.includes('--removeExtraNewLines');

const Clean = () => {
    return new Promise((resolve, reject) => {
        const files = fs.readdirSync(PathToCqlFiles);

        for (const file of files) {
            fs.unlinkSync(path.join(PathToCqlFiles, file));
        }

        resolve();
    });
};

const Main = async () => {
    if (clearInArgs) {
        await Clean();
    }

    for (const schema of Object.keys(schemas)) {
        const { CqlTable, indexes, Types } = schemas[schema];

        if (dryRun) {
            console.log(CqlTable);
            console.log(indexes.join('\n'));
            console.log(Types.join('\n'));

            continue;
        }

        fs.writeFileSync(path.join(PathToCqlFiles, `${schema}.cql`), '');
        fs.appendFileSync(path.join(PathToCqlFiles, `${schema}.cql`), `${Types.join('\n')}`);
        fs.appendFileSync(path.join(PathToCqlFiles, `${schema}.cql`), `\n${CqlTable}`);

        if (indexes.length > 0) {
            fs.writeFileSync(path.join(PathToCqlFiles, `${schema}_indexes.cql`), indexes.join('\n'));
        }

        if (removeExtraNewLines) {
            const file = fs.readFileSync(path.join(PathToCqlFiles, `${schema}.cql`), 'utf8');

            fs.writeFileSync(path.join(PathToCqlFiles, `${schema}.cql`), file.replace(/\n\n\n/g, ''));
        }
    }
};


Main();
