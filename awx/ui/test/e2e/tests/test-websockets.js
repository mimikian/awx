import {
    getInventorySource,
    getJobTemplate,
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

module.exports = {
    before: (client, done) => {
        const resources = [
            getInventorySource('test-websockets'),
            getJobTemplate('test-websockets', 'debug.yml'),
            getJobTemplate('test-websockets', 'fail_unless.yml'),
            getProject(),
            getWorkflowTemplate('test-websockets'),
        ];
        Promise.all(resources)
            .then(([inventory, success_job, fail_job, project, workflow]) => {
                data = { inventory, success_job, fail_job, project, workflow };
                done();
            });
        client
            .login()
            .waitForAngular()
            .resizeWindow(1200, 1000);
    },
    'Test job template status updates for a successful job on dashboard': client => {
        client.useXpath().findThenClick(dashboard);
        getJob('test-websockets'); // Automatically starts job
        client.expect.element(spinny).to.not.be.visible.before(5000);
        client.expect.element(sparklineIcon + '[1]' + running)
            .to.be.visible.before(5000);
        client.expect.element(spinny).to.not.be.visible.before(5000);
        // wait for the test job to complete. element goes stale if a timeout is used
        client.pause(20000);
        client.expect.element(sparklineIcon + '[1]' + success)
            .to.have.attribute('class').which.does.not.contain('ng-hide').after(5000);
    },
    'Test job template status updates for a failed job on dashboard': client => {
        client.useXpath().findThenClick(dashboard);
        getJob('test-websockets'); // Automatically starts job
        client.expect.element(spinny).to.not.be.visible.before(5000);
        client.expect.element(sparklineIcon + '[1]' + running)
            .to.be.visible.before(5000);
        client.expect.element(spinny).to.not.be.visible.before(5000);
        // wait for the test job to complete. element goes stale if a timeout is used
        client.pause(20000);
        client.expect.element(sparklineIcon + '[1]' + success)
            .to.have.attribute('class').which.does.not.contain('ng-hide').after(5000);
    },
    after: client => {
        client.end();
    }
};
