import fs from 'node:fs'
import archiver from 'archiver'
import manifest from '../manifest.json'

console.log('开始创建ZIP包...')

function zipDirectory(dirpath: string, destpath: string, outPath: string) {
  console.log(`打包目录: ${dirpath}`)
  console.log(`目标路径: ${destpath}`)
  console.log(`输出文件: ${outPath}`)
  
  if (!fs.existsSync(dirpath)) {
    console.error(`错误: 目录 ${dirpath} 不存在`)
    return Promise.reject(new Error(`目录 ${dirpath} 不存在`))
  }

  const archive = archiver('zip', { zlib: { level: 9 } })
  const stream = fs.createWriteStream(outPath)

  return new Promise<void>((resolve, reject) => {
    archive
      .directory(dirpath, destpath)
      .on('error', err => {
        console.error('打包错误:', err)
        reject(err)
      })
      .pipe(stream)

    stream.on('close', () => {
      console.log(`ZIP包创建成功: ${outPath}`)
      resolve()
    })
    
    archive.on('warning', warning => {
      console.warn('警告:', warning)
    })
    
    archive.finalize()
  })
}

const dirpath = 'dist'
const destpath = 'Chrome-Extension-Tarou'
const zipFilePath = `${destpath} v${manifest.version}.zip`

console.log(`版本号: ${manifest.version}`)

zipDirectory(dirpath, destpath, zipFilePath)
  .then(() => console.log('打包完成'))
  .catch(err => console.error('打包失败:', err))
