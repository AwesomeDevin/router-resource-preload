const _path = require('path')
const _fs = require('fs')

const NAME = 'webpack-route-resource-manifest';

function toAsset(str) {
	if (/\.js$/i.test(str)) return 'script';
	if (/\.(svg|jpe?g|png|webp)$/i.test(str)) return 'image';
	if (/\.(woff2?|otf|ttf|eot)$/i.test(str)) return 'font';
	if (/\.css$/i.test(str)) return 'style';
	return false;
}

function toLink(assets, _pattern, _filemap) {
	let value = '';
	assets.forEach(obj => {
		if (value) value += ', ';
		value += `<${obj.href}>; rel=preload; as=${obj.type}`;
		if (/^(font|script)$/.test(obj.type)) value += '; crossorigin=anonymous';
	});
	return [{ key: 'Link', value }];
}

function toFunction(val) {
	if (typeof val === 'function') return val;
	if (typeof val === 'object') return key => val[key];
}

class RouteResourceManifest {
	constructor(opts={}) {
		const { assets, headers, minify, modulePrefetchMap, mfPrefetchMap  } = opts;
		const { filename='manifest.json', sort=true,  basename = '' } = opts;
		let { routes } = opts

		if (!routes && !modulePrefetchMap && !mfPrefetchMap) {
			throw new Error('routes mapping is required');
		}

		const routePrefetchKeys = modulePrefetchMap ? Object.keys(modulePrefetchMap) : []
		const mfPrefetchKeys = mfPrefetchMap ? Object.keys(mfPrefetchMap) : []


		if(!routes && routePrefetchKeys.length){
			routes =  (str) => {
				for(var index = 0; index < routePrefetchKeys.length; index++){
					const route = routePrefetchKeys[index]
					if(modulePrefetchMap[route].includes(str)){
						return route
					}
				}
				return str
			}
		}

		const toRoute = toFunction(routes);
		const toHeaders = toFunction(headers) || headers === true && toLink;
		const toType = toFunction(assets) || toAsset;

		this.run = bundle => {
			const Pages = new Map();
			const Manifest = {};
			const Files = {};

			const { chunks, modules } = bundle.getStats().toJson();

			// Map pages to files
			chunks.forEach(chunk => {
				const { id, files, origins, entry } = chunk;
				const origin = origins[0].request;
				const route = origin && !entry ? toRoute(origin) : '*';
				if (route) {
					Pages.set(id, {
						assets: new Set(files),
						pattern: route
					});
				}
			});

			// Grab extra files per route
			modules.forEach(mod => {
				mod.assets.forEach(asset => {
					mod.chunks.forEach(id => {
						const tmp = Pages.get(id);
						if (tmp) {
							tmp.assets.add(asset);
							Pages.set(id, tmp);
						}
					});
				});
			});

			// Construct `Files` first
			Pages.forEach(obj => {
				let tmp = Files[obj.pattern] = Files[obj.pattern] || [];

				// Iterate, possibly filtering out
				// TODO: Add priority hints?
				obj.assets.forEach(str => {
					let type = toType(str);
					let href = _path.join(basename, str)
					if (type) tmp.push({ type, href });
				});
			});


			





			function write(data) {

				const str = JSON.stringify(data, null, minify ? 0 : 2);
				bundle.assets[filename] = {
					size: () => str.length,
					source: () => str
				};
			}

			// All patterns
			const routes = Object.keys(Files);

			// Resolve module federation resource
			if(mfPrefetchKeys.length){
				mfPrefetchKeys.forEach(key=>{
					routes.forEach(route=>{
						if(mfPrefetchMap[key].includes(route)){
							Files[key].push({type: 'mf', href: route})
							delete Files[route]
						}
					})
				})
			}
		

			// No headers? Then stop here
			if (!toHeaders) {
				if (!sort) return write(Files); // order didn't matter
				return write(routes.reduce((o, key) => (o[key]=Files[key], o), {}));
			}

			// Otherwise compute "headers" per pattern
			// And save existing Files as "files" key
			routes.forEach(pattern => {
				const files = Files[pattern];
				const headers = toHeaders(files, pattern, Files) || [];
				Manifest[pattern] = { files, headers };
			});

			return write(Manifest);
		};
	}

	apply(compiler) {
		if (compiler.hooks !== void 0) {
			compiler.hooks.emit.tap(NAME, this.run);
		} else {
			compiler.plugin('emit', this.run);
		}
	}
}

module.exports = RouteResourceManifest;