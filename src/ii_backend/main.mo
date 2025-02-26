import Principal "mo:base/Principal";

actor {
	public shared(msg) func greet(name : Text) : async Text {
		return "Hello, " # name # "! Your principal is: " # Principal.toText(msg.caller);
	};

	public shared query (msg) func whoami() : async Principal {
		msg.caller
	};
};
	