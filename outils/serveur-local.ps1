# Petit serveur web local pour tester le jeu sur ce PC (aucune installation requise).
# Utilisation : clic droit > "Executer avec PowerShell", puis ouvrir http://localhost:8080/
param([int]$Port = 8080)

$racine = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.webmanifest' = 'application/manifest+json'
  '.json' = 'application/json'
  '.png' = 'image/png'
  '.svg' = 'image/svg+xml'
  '.mp3' = 'audio/mpeg'
  '.m4a' = 'audio/mp4'
  '.md' = 'text/plain; charset=utf-8'
}

$serveur = New-Object System.Net.HttpListener
$serveur.Prefixes.Add("http://localhost:$Port/")
$serveur.Start()
Write-Host "Jeu disponible sur http://localhost:$Port/  (Ctrl+C pour arreter)"

try {
  while ($serveur.IsListening) {
    $ctx = $serveur.GetContext()
    $rep = $ctx.Response
    try {
      $chemin = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($chemin -eq '' -or $chemin.EndsWith('/')) { $chemin += 'index.html' }
      $fichier = [IO.Path]::GetFullPath((Join-Path $racine $chemin))
      if ($fichier.StartsWith($racine) -and (Test-Path -LiteralPath $fichier -PathType Leaf)) {
        $octets = [IO.File]::ReadAllBytes($fichier)
        $ext = [IO.Path]::GetExtension($fichier).ToLower()
        if ($types.ContainsKey($ext)) { $rep.ContentType = $types[$ext] } else { $rep.ContentType = 'application/octet-stream' }
        $rep.Headers.Add('Cache-Control', 'no-cache')
        $rep.ContentLength64 = $octets.Length
        $rep.OutputStream.Write($octets, 0, $octets.Length)
      } else {
        $rep.StatusCode = 404
      }
    } catch {
      $rep.StatusCode = 500
    } finally {
      $rep.Close()
    }
  }
} finally {
  $serveur.Stop()
}
