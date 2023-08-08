class CqlTable {
    static convertStringToSnakeCase(str) {
        const CamelCaseRegex = /^(?:[a-z]+(?:[A-Z][a-z]*)*)$/g;
        const PascalCaseRegex = /^(?:[A-Z][a-z]*)+$/g;
        const SnakeCaseRegex = /^(?:[a-z]+(?:_[a-z]+)*)$/g;

        if (SnakeCaseRegex.test(str)) {
            return str; // its already snakey boi
        }

        if (CamelCaseRegex.test(str) || PascalCaseRegex.test(str)) {
            return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
        }

        console.log('Unknown case for string: ', str);

        return str;
    }

    static MappingToMap(type, keyname, array, primaryKey, typeName, bigInt) {
        switch (type?.toLowerCase()) {
            case 'string': {
                return `\t${keyname} ${array ? `list<${bigInt ? 'bigint' : 'text'}>` : `${bigInt ? 'bigint' : 'text'}`}${primaryKey ? ' PRIMARY KEY' : ''},\n`;
            }

            case 'number': {
                return `\t${keyname} ${array ? 'list<int>' : 'int'}${primaryKey ? ' PRIMARY KEY' : ''},\n`;
            }

            case 'bigint': {
                return `\t${keyname} ${array ? 'list<bigint>' : 'bigint'}${primaryKey ? ' PRIMARY KEY' : ''},\n`;
            }

            case 'boolean': {
                return `\t${keyname} ${array ? 'list<boolean>' : 'boolean'}${primaryKey ? ' PRIMARY KEY' : ''},\n`;
            }

            case 'array': {
                // if its just an array then we guess its text? we wouldn't know if its an array then its an array of arrays of strings?
                return `\t${keyname} ${array ? 'list<list<text>>' : 'list<text>'}${primaryKey ? ' PRIMARY KEY' : ''},\n`;
            }

            case 'object': {
                // if its just an object then we guess its text? we wouldn't know
                return `\t${keyname} ${array ? 'list<map<text, text>>' : 'map<text, text>'}${primaryKey ? ' PRIMARY KEY' : ''},\n`;
            }

            case 'date': {
                return `\t${keyname} ${array ? 'list<timestamp>' : 'timestamp'}${primaryKey ? ' PRIMARY KEY' : ''},\n`;
            }

            case 'set': {
                return `\t${keyname} ${array ? 'list<set<text>>' : 'set<text>'}${primaryKey ? ' PRIMARY KEY' : ''},\n`;
            }

            case 'type': {
                return `\t${keyname} ${array ? `list<frozen<${typeName}>>` : `frozen<${typeName}>`}${primaryKey ? ' PRIMARY KEY' : ''},\n`;
            }

            default: {
                console.warn('Unknown type: ', type, keyname);
                // we default to text
                return `\t${keyname} ${array ? 'list<text>' : 'text'}${primaryKey ? ' PRIMARY KEY' : ''},\n`;
            }
        }
    }

    static convertObjectToCqlType(Name, Obj, array) {
        const Keys = Object.keys(Obj);

        let CqlType = `CREATE TYPE IF NOT EXISTS ${Name.toLowerCase()} (\n`;

        const extraTypes = [];

        for (const key of Keys) {
            const value = Obj[key];

            if (Array.isArray(value)) {
                console.warn('Array in object, skipping', Name, key);

                continue;
            }

            if (!value.type) {
                const split = Name.split('_');
                const typeName = split[split.length - 1];

                const newType = typeName.replace(/s$/, '');

                const converted = this.convertObjectToCqlType(Name + "_" + newType, value);

                for (const type of converted.extraTypes) {
                    extraTypes.push(type);
                }

                extraTypes.push(converted.CqlType);

                continue;
            }

            CqlType += this.MappingToMap(value.type.name.toLowerCase(), this.convertStringToSnakeCase(key), false, false, null, Boolean(value.ref));
        }

        CqlType += ');\n';

        return {
            CqlType,
            extraTypes
        };
    }

    static convertObjToCqlTable(Name, Obj) {
        const Keys = Object.keys(Obj);
        let CqlTable = `CREATE TABLE IF NOT EXISTS ${Name.toLowerCase()} (\n`;
        const indexes = [];
        const Types = []; // CREATE TYPE IF NOT EXISTS <type name> for example, used for when theres an array of objects
        let primaryKeySet = false;

        for (const key of Keys) {
            const snakeCaseKey = key === '_id' ? 'id' : this.convertStringToSnakeCase(key);
            const value = Obj[key];

            primaryKeySet = key === '_id' ? true : primaryKeySet;

            if (Array.isArray(value)) {
                const valuetwo = value[0];

                if (valuetwo.index) {
                    indexes.push(`CREATE INDEX IF NOT EXISTS ${Name.toLowerCase()}_${snakeCaseKey}_index ON ${Name.toLowerCase()} (${snakeCaseKey});`);
                }

                if (!valuetwo.type && typeof valuetwo === 'object' && !Array.isArray(valuetwo)) {
                    const converted = this.convertObjectToCqlType(`${this.convertStringToSnakeCase(Name)}_${snakeCaseKey}`, valuetwo);

                    for (const type of converted.extraTypes) {
                        Types.push(type);
                    }

                    Types.push(converted.CqlType);

                    CqlTable += this.MappingToMap('type', snakeCaseKey, false, false, `${this.convertStringToSnakeCase(Name)}_${snakeCaseKey}`, Boolean(valuetwo.ref));

                    continue;
                }

                if (Array.isArray(valuetwo.type)) {
                    console.log('arraiy bio', Array.isArray(valuetwo.type));
                } else {
                    CqlTable += this.MappingToMap(valuetwo.type.name, snakeCaseKey, true, false, null, Boolean(valuetwo.ref));
                }

                continue;
            }

            if (value.index) {
                indexes.push(`CREATE INDEX IF NOT EXISTS ${Name.toLowerCase()}_${snakeCaseKey}_index ON ${Name.toLowerCase()} (${snakeCaseKey});`);
            }

            if (!value.type || typeof value.type !== "function" && typeof value === 'object' && !Array.isArray(value)) {
                if (Array.isArray(value.type)) {
                    const converted = this.convertObjectToCqlType(`${this.convertStringToSnakeCase(Name)}_${snakeCaseKey}`, value.type[0], true);

                    for (const type of converted.extraTypes) {
                        Types.push(type);
                    }

                    Types.push(converted.CqlType);

                    CqlTable += this.MappingToMap('type', snakeCaseKey, true, false, `${this.convertStringToSnakeCase(Name)}_${snakeCaseKey}`, Boolean(value.ref));
                } else {
                    const converted = this.convertObjectToCqlType(`${this.convertStringToSnakeCase(Name)}_${snakeCaseKey}`, value, false);

                    for (const type of converted.extraTypes) {
                        Types.push(type);
                    }

                    Types.push(converted.CqlType);

                    CqlTable += this.MappingToMap('type', snakeCaseKey, false, false, `${this.convertStringToSnakeCase(Name)}_${snakeCaseKey}`, Boolean(value.ref));
                }

                continue;
            }

            CqlTable += this.MappingToMap(value.type.name, snakeCaseKey, false, key === '_id', null, Boolean(value.ref) || key === '_id');
        }

        if (!primaryKeySet) {
            // grab the first index and that is the primary key
            const firstIndex = indexes[0]
            const regex = /\(([^)]+)\)?;$/g;

            const firstIndexName = regex.exec(firstIndex)?.[1];

            if (firstIndexName) {
                indexes.shift();

                CqlTable += `\tPRIMARY KEY (${firstIndexName})\n`;
            } else {
                console.log('No primary key set for', Name, firstIndex)
            }

        }

        CqlTable += `);`;

        return {
            CqlTable,
            indexes,
            Types,
        };
    }
}

class Schema {
    constructor(obj) {
        this.obj = obj;
    }
}

const model = (name, fakeSchema) => {
    return CqlTable.convertObjToCqlTable(name, fakeSchema.obj);
};

module.exports = {
    model,
    Schema,
    CqlTable,
};
