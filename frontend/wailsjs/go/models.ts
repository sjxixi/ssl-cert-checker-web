export namespace main {
	
	export class CertificateInfo {
	    id?: number;
	    domain: string;
	    issuer: string;
	    subject: string;
	    notBefore: string;
	    notAfter: string;
	    daysRemaining: number;
	    isValid: boolean;
	    status: string;
	    serialNumber: string;
	    version: number;
	    queryTime?: string;
	    sanDomains?: string[];
	
	    static createFrom(source: any = {}) {
	        return new CertificateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.domain = source["domain"];
	        this.issuer = source["issuer"];
	        this.subject = source["subject"];
	        this.notBefore = source["notBefore"];
	        this.notAfter = source["notAfter"];
	        this.daysRemaining = source["daysRemaining"];
	        this.isValid = source["isValid"];
	        this.status = source["status"];
	        this.serialNumber = source["serialNumber"];
	        this.version = source["version"];
	        this.queryTime = source["queryTime"];
	        this.sanDomains = source["sanDomains"];
	    }
	}
	export class BatchQueryResult {
	    success: boolean;
	    message: string;
	    total: number;
	    results: CertificateInfo[];
	    errors?: string[];
	
	    static createFrom(source: any = {}) {
	        return new BatchQueryResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.total = source["total"];
	        this.results = this.convertValues(source["results"], CertificateInfo);
	        this.errors = source["errors"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class HistoryQueryResult {
	    success: boolean;
	    message: string;
	    total: number;
	    records: CertificateInfo[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new HistoryQueryResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.total = source["total"];
	        this.records = this.convertValues(source["records"], CertificateInfo);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ImportDomainsResult {
	    success: boolean;
	    message: string;
	    total: number;
	    successCount: number;
	    skippedCount: number;
	    failedCount: number;
	    failedDomains: string[];
	
	    static createFrom(source: any = {}) {
	        return new ImportDomainsResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.total = source["total"];
	        this.successCount = source["successCount"];
	        this.skippedCount = source["skippedCount"];
	        this.failedCount = source["failedCount"];
	        this.failedDomains = source["failedDomains"];
	    }
	}
	export class NotificationItem {
	    id: number;
	    domain: string;
	    nickname?: string;
	    daysRemaining: number;
	    notAfter: string;
	    threshold: number;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new NotificationItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.domain = source["domain"];
	        this.nickname = source["nickname"];
	        this.daysRemaining = source["daysRemaining"];
	        this.notAfter = source["notAfter"];
	        this.threshold = source["threshold"];
	        this.status = source["status"];
	    }
	}
	export class NotificationResult {
	    success: boolean;
	    message: string;
	    total: number;
	    items: NotificationItem[];
	
	    static createFrom(source: any = {}) {
	        return new NotificationResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.total = source["total"];
	        this.items = this.convertValues(source["items"], NotificationItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class QueryResult {
	    success: boolean;
	    message: string;
	    data?: CertificateInfo;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new QueryResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.data = this.convertValues(source["data"], CertificateInfo);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class WatchedDomain {
	    id: number;
	    domain: string;
	    nickname?: string;
	    addedTime: string;
	    lastCheckTime?: string;
	    certInfo?: CertificateInfo;
	    notifyEnabled: boolean;
	    notifyThreshold: number;
	    isManual: boolean;
	    manualExpireDate?: string;
	    manualStartDate?: string;
	
	    static createFrom(source: any = {}) {
	        return new WatchedDomain(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.domain = source["domain"];
	        this.nickname = source["nickname"];
	        this.addedTime = source["addedTime"];
	        this.lastCheckTime = source["lastCheckTime"];
	        this.certInfo = this.convertValues(source["certInfo"], CertificateInfo);
	        this.notifyEnabled = source["notifyEnabled"];
	        this.notifyThreshold = source["notifyThreshold"];
	        this.isManual = source["isManual"];
	        this.manualExpireDate = source["manualExpireDate"];
	        this.manualStartDate = source["manualStartDate"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class WatchedDomainsResult {
	    success: boolean;
	    message: string;
	    total: number;
	    domains: WatchedDomain[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new WatchedDomainsResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.total = source["total"];
	        this.domains = this.convertValues(source["domains"], WatchedDomain);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

