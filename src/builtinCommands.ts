import fs from 'fs'
import { join } from 'path'
import JSZip from 'jszip'
import { fsState } from './loadSave'
import { closeWan, openToWanAndCopyJoinLink } from './localServerMultiplayer'
import { resetLocalStorageWorld } from './browserfs'
import { saveServer } from './flyingSquidUtils'

const notImplemented = () => {
  return 'Not implemented yet'
}

async function addFolderToZip (folderPath, zip, relativePath) {
  const entries = await fs.promises.readdir(folderPath)

  for (const entry of entries) {
    const entryPath = join(folderPath, entry)
    const stats = await fs.promises.stat(entryPath)

    const zipEntryPath = join(relativePath, entry)

    if (stats.isDirectory()) {
      const subZip = zip.folder(zipEntryPath)
      await addFolderToZip(entryPath, subZip, zipEntryPath)
    } else {
      const fileData = await fs.promises.readFile(entryPath)
      zip.file(entry, fileData)
    }
  }
}


// todo include in help
const exportWorld = async () => {
  // todo issue into chat warning if fs is writable!
  const zip = new JSZip()
  let { worldFolder } = localServer.options
  if (!worldFolder.startsWith('/')) worldFolder = `/${worldFolder}`
  await addFolderToZip(worldFolder, zip, '')

  // Generate the ZIP archive content
  const zipContent = await zip.generateAsync({ type: 'blob' })

  // Create a download link and trigger the download
  const downloadLink = document.createElement('a')
  downloadLink.href = URL.createObjectURL(zipContent)
  // todo use loaded zip/folder name
  downloadLink.download = 'world-prismarine-exported.zip'
  downloadLink.click()

  // Clean up the URL object after download
  URL.revokeObjectURL(downloadLink.href)
}

window.exportWorld = exportWorld

const writeText = (text) => {
  bot._client.emit('chat', {
    message: JSON.stringify({ text })
  })
}

const commands = [
  {
    command: ['/download', '/export'],
    invoke: exportWorld
  },
  {
    command: ['/publish', '/share'],
    async invoke () {
      const text = await openToWanAndCopyJoinLink(writeText)
      if (text) writeText(text)
    }
  },
  {
    command: ['/close'],
    invoke () {
      const text = closeWan()
      if (text) writeText(text)
    }
  },
  {
    command: '/reset-world -y',
    async invoke () {
      if (fsState.inMemorySave) return
      // todo for testing purposes
      sessionStorage.oldWorldData = localStorage
      console.log('World removed. Old data saved to sessionStorage.oldData')
      localServer.quit()
      resetLocalStorageWorld()
    }
  },
  {
    command: ['/save'],
    async invoke () {
      await saveServer()
    }
  }
]

export const getBuiltinCommandsList = () => commands.flatMap(command => command.command)

export const tryHandleBuiltinCommand = (message) => {
  if (!localServer) return

  for (const command of commands) {
    if (command.command.includes(message)) {
      void command.invoke() // ignoring for now
      return true
    }
  }
}
