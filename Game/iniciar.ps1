param([int]$Porta = 5174)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) { throw 'Instale Node.js 22 ou superior e execute novamente.' }
if (-not (Test-Path -LiteralPath "$PSScriptRoot\node_modules\vite\bin\vite.js")) {
  throw 'Dependências ausentes. Execute npm install ou pnpm install nesta pasta.'
}
Write-Host "Eternal Realms: http://127.0.0.1:$Porta" -ForegroundColor Yellow
Write-Host 'Mantenha este terminal aberto. Ctrl+C encerra o servidor.'
& $nodeCommand.Source "$PSScriptRoot\node_modules\vite\bin\vite.js" --host 127.0.0.1 --port $Porta
