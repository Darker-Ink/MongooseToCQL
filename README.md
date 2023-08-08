# MongooseToCQL
Simple script for turning a Mongoose Schema into a CQL Table, not the best code but very useful (for me)

# How it works

Take a look at `ExampleSchema.js` and `SchemaReplacer.js` These are the important files.

ExampleSchema is just how it will work, Pretty much take a Mongoose schema but using the exports from MongooseMimic.js you change Schema and model.

Once you run it you are left with an export of an object of CqlTable, indexes, Types. SchemaReplacer is a example way of what you can do with the code after.

ExampleSchema exports a "DM" schema, here is the outputted cql table

```cql
CREATE TYPE IF NOT EXISTS dm_recipients (
	user bigint,
	flags int,
);

CREATE TABLE IF NOT EXISTS dm (
	id bigint PRIMARY KEY,
	recipients list<frozen<dm_recipients>>,
	channel bigint,
	flags int,
);
```

Some parts are weird (mostly as its for me), anything with a "ref" instantly becomes a bigint, _id also becomes a bigint (and a primary key).

Overall its simple
