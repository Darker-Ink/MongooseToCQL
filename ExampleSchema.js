const { Schema, model } = require('./MongooseMimic.js');

const DmSchema = new Schema({
	_id: {
		type: String,
		required: true,
	},

	Recipients: {
		type: [
			{
				User: {
					type: String,
					required: true,
					ref: 'Users',
				},
				Flags: {
					type: Number,
					required: true,
				},
			},
		],
		required: true,
	},

	Channel: {
		type: String,
		required: true,
		ref: 'Channels',
	},

	Flags: {
		type: Number,
		required: true,
		default: 0,
	},
});

module.exports = {
   model('Dm', DmSchema)
}
