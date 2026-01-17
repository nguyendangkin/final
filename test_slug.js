function run() {
    const uuidPattern = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    const slug = "chin-nguyen-524ea9b5-10c5-46cf-bf42-af2105086869";
    const match = slug.match(uuidPattern);

    console.log("Slug:", slug);
    console.log("Match:", match ? match[0] : "No match");

    if (match && match[0] === "524ea9b5-10c5-46cf-bf42-af2105086869") {
        console.log("SUCCESS");
    } else {
        console.log("FAILED");
    }
}

run();
