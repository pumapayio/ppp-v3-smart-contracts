const lcov2badge = require('lcov2badge');
const fs = require('fs');

const options = {
	filePath: './coverage/lcov.info',
	okColor: 'green',
	warnColor: 'yellow',
	koColor: 'orange',
	warnThreshold: 90,
	koThreshold: 70
};

lcov2badge.badge(options, function (err, svgBadge) {
	if (err) throw err;

	fs.writeFile('coverage_badge.svg', svgBadge, (err) => {
		if (err) {
			console.error(err);
			return;
		}
		console.log('Coverage badge created!');
	});
});
