cask 'bitwarden-cli' do
  version '__version__'
  sha256 '__checksum__'

  # github.com/bitwarden/cli was verified as official when first introduced to the cask
  url "https://github.com/bitwarden/cli/releases/download/v#{version}/bw-macos-#{version}.zip"
  appcast 'https://github.com/bitwarden/cli/releases.atom',
          checkpoint: '__checkpoint__'
  name 'Bitwarden CLI'
  homepage 'https://bitwarden.com/'

  binary "#{appdir}/bw"
end
