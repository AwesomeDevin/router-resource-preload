const _path = require('path')

const NAME = 'webpack-route-resource-manifest';

declare namespace NameSpaceRouteResourcePreloadPlugin {
	type Pattern = string;
	type Filter<T> = T | false | void | null;

	interface Asset {
		type: string;
		href: string;
	}

	type FileMap = Record<Pattern, Asset[]>;

	interface Options {
		modulePrefetchMap?: Record<string, Pattern>
		mfPrefetchMap?: Record<string, Pattern>
		routes?: Record<string, Pattern> | ((input: string) => Filter<Pattern>);
		assets?: Record<string, string> | ((filepath: string) => Filter<string>);
		headers?: true | ((files: Asset[], pattern: Pattern, filemap: FileMap) => any[]);
		filename?: string;
		minify?: boolean;
		basename?: string
	}
}

interface IRouteResourcePreloadPlugin {
	run(compilation: any): void;
	apply(compiler: any): void;
}

function toAsset(str: string) {
	if (/\.js$/i.test(str)) return 'script';
	if (/\.(svg|jpe?g|png|webp)$/i.test(str)) return 'image';
	if (/\.(woff2?|otf|ttf|eot)$/i.test(str)) return 'font';
	if (/\.css$/i.test(str)) return 'style';
	return false;
}

function toLink(
	assets: {href: string, type: string}[],
	//  _pattern, _filemap
	) {
	let value = '';
	assets.forEach(obj => {
		if (value) value += ', ';
		value += `<${obj.href}>; rel=preload; as=${obj.type}`;
		if (/^(font|script)$/.test(obj.type)) value += '; crossorigin=anonymous';
	});
	return [{ key: 'Link', value }];
}

function toFunction(val: boolean | Function | Record<string, any>) {
	if (typeof val === 'function') return val;
	if (typeof val === 'object') return (key: string) => val[key];
}

class RouteResourcePreloadPlugin implements IRouteResourcePreloadPlugin  {
	run: (compilation: any) => void;

	constructor(opts: NameSpaceRouteResourcePreloadPlugin.Options) {
		const { assets, headers, minify, modulePrefetchMap, mfPrefetchMap  } = opts || {};
		const { filename='manifest.json',  basename = '' } = opts || {};
		let { routes } = opts || {}

		if (!routes && !modulePrefetchMap && !mfPrefetchMap) {
			throw new Error('One of routes/modulePrefetchMap/mfPrefetchMap mapping is required');
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
			const Manifest: Record<string, any> = {};
			const Files: Record<string, {type: string, href: string}[]> = {};

			const { chunks, modules } = bundle.getStats().toJson();

			chunks.forEach((chunk: any) => {
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

			modules.forEach((mod: {
				assets: string[]
				chunks: string[]
			}) => {
				mod.assets.forEach((asset: any) => {
					mod.chunks.forEach(id => {
						const tmp = Pages.get(id);
						if (tmp) {
							tmp.assets.add(asset);
							Pages.set(id, tmp);
						}
					});
				});
			});

			Pages.forEach(obj => {
				let tmp = Files[obj.pattern] = Files[obj.pattern] || [];

				obj.assets.forEach((str: string) => {
					let type = toType(str);
					let href = _path.join(basename, str)
					if (type) tmp.push({ type, href });
				});
			});

			function write(data: Record<string, any>) {

				const str = JSON.stringify(data, null, minify ? 0 : 2);
				bundle.assets[filename] = {
					size: () => str.length,
					source: () => str
				};
			}


			const routes = Object.keys(Files);


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
		

			if (!toHeaders) {
				return write(Files)
			}

			routes.forEach(pattern => {
				const files = Files[pattern];
				const headers = toHeaders(files, pattern, Files) || [];
				Manifest[pattern] = { files, headers };
			});

			return write(Manifest);
		};
	}


	apply(compiler: any) {
		if (compiler.hooks !== void 0) {
			compiler.hooks.emit.tap(NAME, this.run);
		} else {
			compiler.plugin('emit', this.run);
		}
	}
}

export default RouteResourcePreloadPlugin;