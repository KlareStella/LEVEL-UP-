const contexto = import.meta.webpackContext('./', { recursive: true, regExp: /\.spec\.jsx?$/ })
contexto.keys().forEach(contexto)
