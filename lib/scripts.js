#!/usr/bin/env node
const compressing = require('compressing');

const axios = require('axios')
const fs = require('fs')
const { program, Option } = require('commander');

program
  .addOption(new Option('--file-type <fileType>', 'file type').choices(['json', 'properties']))
  .addOption(new Option('--way <way>', 'way').choices(['tier', 'tile']))
  .option('-o --output <output>', 'output')
  .requiredOption('-p --project <projectId>', 'project')
  .option('--registry <registry>', 'registry');

program.parse();

const options = program.opts();

const registry = options.registry || 'http://locale.tse.com'
const fileType = options.fileType || 'json'
const way = options.way || 'tier'
const output = options.output || 'src/locale'

if (!options.project) {
  console.log('\x1B[31m%s\x1B[39m', '--project is required');
} else {
  const query = `?fileType=${fileType}&projectId=${options.project}&way=${way}`
  const url = registry + '/api/export/file' + query
  axios(url, {
    method: 'get',
    responseType: 'arraybuffer'
  }).then((res) => {
    const str = res.headers['content-disposition'] || ''
    const filename = decodeURIComponent(str?.split('filename=')?.[1] || '')
    fs.writeFile(filename, res.data, (res2) => {
      compressing.zip.uncompress(filename, output).finally(() => {
        fs.unlink(filename, () => {
          console.log('\x1B[32m%s\x1B[39m', 'sync success');
        })
      })
    })
  })
}


