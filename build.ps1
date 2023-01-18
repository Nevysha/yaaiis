Remove-Item yaaiis-build -Recurse
mkdir yaaiis-build
Copy-Item bin yaaiis-build/bin -Recurse
Copy-Item public yaaiis-build/public -Recurse
Copy-Item routes yaaiis-build/routes -Recurse
Copy-Item *.js yaaiis-build/
Copy-Item start.bat yaaiis-build/start.bat
Copy-Item client/dist yaaiis-build/client/dist -Recurse