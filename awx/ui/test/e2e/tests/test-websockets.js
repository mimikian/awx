/* Websocket tests. These tests verify that the sparkline (colored box rows which
 * display job status) update correctly as the jobs progress.
 */

import {
    getInventorySource,
    getProject,
    getJob
} from '../fixtures';

let data;
const spinny = '//*[contains(@class, "spinny")]';
const dashboard = '//at-side-nav-item[contains(@name, "DASHBOARD")]';

// UI elements for recently run job templates on the dashboard.
const successfulJt = '//a[contains(text(), "test-websockets-successful")]/../..';
const failedJt = '//a[contains(text(), "test-websockets-failed")]/../..';
const sparklineIcon = '//div[contains(@class, "SmartStatus-iconContainer")]';

// Sparkline icon statuses. Running is blinking green, successful is green, failed is red.
const running = '//div[@ng-show="job.status === \'running\'"]';
const success = '//div[@ng-show="job.status === \'successful\'"]';

// The UI element for failed/error/canceled jobs is the same.
const failedErrorCanceled = '//div[contains(@ng-show, "job.status === \'failed\'")]';

module.exports = {

    before: (client, done) => {
        // Jobs only display on the dashboard if they have been run at least once.
        const resources = [
            getInventorySource('test-websockets'),
            getProject('test-websockets', 'https://github.com/ansible/test-playbooks'),
            // launch job templates once before running tests.
            getJob('test-websockets', 'debug.yml', 'test-websockets-successful', done),
            getJob('test-websockets', 'fail_unless.yml', 'test-websockets-failed', done)
        ];

        Promise.all(resources)
            .then(([inventory, project, jt1, jt2]) => {
                data = { inventory, project, jt1, jt2 };
                done();
            });

        client
            .login()
            .waitForAngular()
            .resizeWindow(1200, 1000);
    },

    'Test job template status updates for a successful job on dashboard': client => {
        client.useXpath().findThenClick(dashboard);
        getJob('test-websockets', 'debug.yml', 'test-websockets-successful');

        client.expect.element(spinny).to.not.be.visible.before(5000);
        client.expect.element(`${sparklineIcon}[1]${running}`)
            .to.be.visible.before(5000);

        // explicit wait, element goes stale if a timeout is used due to DOM updates
        client.pause(20000);
        client.expect.element(`${successfulJt}${sparklineIcon}[1]${success}`)
            .to.have.attribute('class').which.does.not.contain('ng-hide').after(10000);
    },

    'Test job template status updates for a failed job on dashboard': client => {
        client.useXpath().findThenClick(dashboard);
        getJob('test-websockets', 'fail_unless.yml', 'test-websockets-failed');

        client.expect.element(spinny).to.not.be.visible.before(5000);
        client.expect.element(`${sparklineIcon}[1]${running}`)
            .to.be.visible.before(5000);

        // explicit wait, element goes stale if a timeout is used due to DOM updates
        client.pause(20000);
        client.expect.element(`${failedJt}${sparklineIcon}[1]${failedErrorCanceled}`)
            .to.have.attribute('class').which.does.not.contain('ng-hide').after(10000);
    },
    after: client => {
        client.end();
    }
};
