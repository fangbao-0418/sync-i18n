#!/usr/bin/env node
const compressing = require('compressing');
const http = require('http')
const https = require('https')
const fs = require('fs')
const { program, Option } = require('commander');

program
  .addOption(new Option('--file-type <fileType>', 'file type').choices(['json', 'properties']))
  .addOption(new Option('--way <way>', 'way').choices(['tier', 'tile']))
  .option('-o --output <output>', 'output')
  .requiredOption('-p --project <projectId>', 'project')
  .option('--registry <registry>', 'registry')
  .option('--api-url <apiUrl>', 'api url');

program.parse();

const options = program.opts();

const registry = options.registry || 'http://locale.tse.com'
const apiUrl = options.apiUrl || 'basic/internal/i18nmng-api/project/termspace/package/export/file'
const fileType = options.fileType || 'json'
const way = options.way || 'tier'
const output = options.output || 'src/locale'

const print = {
  error: (msg) => {
    console.log('\x1B[31m%s\x1B[39m', msg);
  },
  success: (msg) => {
    console.log('\x1B[32m%s\x1B[39m', msg);
  }
}

if (!options.project) {
  print.error('--project is required');
} else {
  const query = `?fileType=${fileType}&projectCode=${options.project}&way=${way}`;
  const url = registry + apiUrl + query
  const request =  url.indexOf('https') == 0 ? https.request : http.request;
  const req = request(url, {
    method: 'get',
  }, (res) => {
    const str = res.headers['content-disposition']
    const filename = decodeURIComponent(str?.split('filename=')?.[1] || 'unkonw.zip')
    const data = []
    if (![200, 201].includes(res.statusCode)) {
      print.error('sync failed, status code ' + res.statusCode)
      return
    }
    res.on('data', (chunk) => {
      data.push(chunk)
    })
    res.on('end', () => {
      if (!data.length) {
        print.error('sync failed, no data')
        return
      }
      const responseData = Buffer.concat(data);
      fs.writeFile(filename, responseData, (res2) => {
        compressing.zip.uncompress(filename, output).finally(() => {
          fs.unlink(filename, () => {
            print.success('sync success');
          })
        })
      })
    })
  })
  req.end()
  req.on('error', (error) => {
    print.error(error.message)
  })
}


