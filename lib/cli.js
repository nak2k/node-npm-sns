const https = require('https');
const { makeSigner } = require('aws4-with-assume-role');
const { red } = require('chalk');
const { readFile } = require('fs');

function main(callback) {
  const { NPM_SNS_TOPIC_ARN } = process.env;

  if (!NPM_SNS_TOPIC_ARN) {
    return callback(new Error('Environment variable NPM_SNS_TOPIC_ARN must be set.'));
  }

  readFile('package.json', 'utf8', (err, data) => {
    if (err) {
      return callback(err);
    }

    makeSigner({}, (err, sign) => {
      if (err) {
        throw err;
      }

      request(
        sign({
          method: 'POST',
          service: 'sns',
          path: '/',
          body: `Action=Publish&Message=${data}&TopicArn=${NPM_SNS_TOPIC_ARN}`,
        })
      );
    });
  });
}

function request(options) {
  https.request(options, res => { res.pipe(process.stdout) })
    .end(options.body || '');
}

function exitOnError(err) {
  if (err) {
    showError(err);
    process.exit(1);
  }
}

function showError(err) {
  console.error(`[${red('ERROR')}] ${err.message}`);

  if (process.env.DEBUG) {
    console.error();
    console.error(err);
  }
}

main(exitOnError);
