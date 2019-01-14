import {
    getInventorySource,
    getProject,
    getWorkflowTemplate,
    getJob
} from '../fixtures';

let data;
const spinny = '//*[contains(@class, "spinny")]';
const dashboard = '//at-side-nav-item[contains(@name, "DASHBOARD")]';

const sparklineIcon = '//div[contains(@class, "SmartStatus-iconContainer")]';
const running = '//div[@ng-show="job.status === \'running\'"]';
const success = '//div[@ng-show="job.status === \'successful\'"]';
const failed = '//div[@ng-show="job.status === \'failed\'"]';

module.exports = {

    before: (client, done) => {

        const resources = [
            getInventorySource('test-websockets'),
            getProject('test-websockets', 'https://github.com/ansible/test-playbooks'),
            getJob('test-websockets', 'debug.yml'),
            getJob('test-websockets', 'fail_unless.yml', 'test-websockets-fail'),
            getWorkflowTemplate('test-websockets')
        ];

        Promise.all(resources)
            .then(([inventory, project, jt, failjt, wfjt]) => {
                data = { inventory, project, jt, failjt, wfjt };
                done();
            });

        client
            .pause(10000)
            .login()
            .waitForAngular()
            .resizeWindow(1200, 1000);
    },

    'Verify that job progress updates correctly for a normal job on the dashboard.': client => {

        client.useXpath().findThenClick(dashboard);
        getJob('test-websockets', 'debug.yml'); // launches job

        client.expect.element(spinny).to.not.be.visible.before(5000);
        client.expect.element(sparklineIcon + '[1]' + running)
            .to.be.visible.before(5000);
        client.expect.element(spinny).to.not.be.visible.before(5000);

        // wait for the test job to complete. element goes stale if a timeout is used
        client.pause(10000);
        client.expect.element(sparklineIcon + '[1]' + success)
            .to.have.attribute('class').which.does.not.contain('ng-hide').after(5000);

    },

    'Verify that job progress updates correctly for a failed job on the dashboard.': client => {

        getJob('test-websockets', 'fail_unless.yml', 'test-websockets-fail');

        client.expect.element(spinny).to.not.be.visible.before(5000);
        client.expect.element(sparklineIcon + '[1]' + running)
            .to.be.visible.before(5000);
        client.expect.element(spinny).to.not.be.visible.before(5000);

        // wait for the test job to complete. element goes stale if a timeout is used
        client.pause(10000);
        client.expect.element(sparklineIcon + '[1]' + failed)
            .to.have.attribute('class').which.does.not.contain('ng-hide').after(5000);

    },

    after: client => {

        client.end();

    }
};
