const nodemailer = require('nodemailer');
const unhandled = require('electron-unhandled');
const {api, fixPathForAsarUnpack, debugInfo} = require('electron-util');

exports.sendDebugInfoMail = err => {
	const transporter = nodemailer.createTransport({
		host: 'email-smtp.eu-central-1.amazonaws.com',
		port: 465,
		secure: true, // Use SSL
		auth: {
			user: 'AKIAYM5NV3IIARF4DMWJ',
			pass: 'BKiVUBLQuUEC8zB9ZJlsHWhRayKdvjSmzc3FgNTM2nr9'
		}
	});
	transporter.sendMail({
		from: 'pixthrowaway@muell.xyz',
		to: 'jannis@blossey.eu',
		subject: 'Pixtranslator Error',
		text: `Error: ${err.name}
++++++
Message: ${err.message}
+++++++
Debuginfo: ${debugInfo()}`,
		attachments: [
			{
				path: `${fixPathForAsarUnpack(api.app.getAppPath())}/metadatahandler.log`
			},
			{
				path: `${fixPathForAsarUnpack(api.app.getAppPath())}/databasehandler.log`
			}
		]
	}, (err, info) => {
		if (err) {
			unhandled.logError(err);
		}

		if (info) {
			console.info(`${info.envelope}, ${info.messageId}`);
		}
	});
};
