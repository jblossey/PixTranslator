const nodemailer = require('nodemailer');
const aws = require('aws-sdk');
const unhandled = require('electron-unhandled');
const { api, fixPathForAsarUnpack, debugInfo } = require('electron-util');

exports.sendDebugInfoMail = (err) => {
    aws.config.update({
        accessKeyId: 'ses-smtp-user.20200502-153256',
        secretAccessKey: 'AKIAYM5NV3IILDKXNIWS,BBVIwS9Q/reSiGcagnpi/XH990X6vrDo/Ngw442r9QZR',
        region: 'eu-central-1',
    });
    const transporter = nodemailer.createTransport({
        SES: new aws.SES({
            apiVersion: '2012-10-17'
        })
    });
    transporter.sendMail({
        from: 'pixthrowaway@muell.xyz',
        to: 'jannis@blossey.eu',
        subject: 'Pixtranslator Error',
        text: `Error: ${err.name} ++++++
        Message: ${err.message} +++++++
        Debuginfo: ${debugInfo()}`,
        attachments: [
            {
                path: fixPathForAsarUnpack(`${api.app.getAppPath()}/metadatahandler.log`)
            },
            {
                path: fixPathForAsarUnpack(`${api.app.getAppPath()}/databasehandler.log`)
            }
        ],
    }, (err, info) => {
        unhandled.logError(`${info.envelope}, ${info.messageId}`);
    });
};