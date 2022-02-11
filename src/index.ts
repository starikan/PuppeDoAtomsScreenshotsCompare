module.exports = async function atomRun(): Promise<void> {
  const path = __non_webpack_require__('path');
  const util = __non_webpack_require__('util');

  const looksSame = util.promisify(__non_webpack_require__('looks-same'));
  const createDiff = util.promisify(__non_webpack_require__('looks-same').createDiff);

  const { name, rootFolder: rootFolderIncome, folder: folderIncome } = this.data;
  const { options } = this;
  const { selector } = this.selectors;

  const regimesAvailable = ['create-screenshots', 'compare-screenshots'];
  if (!regimesAvailable.includes(process.env.PPD_SCREENSHOT_COMPARE_REGIME)) {
    throw new Error(
      `Environment param PPD_SCREENSHOT_COMPARE_REGIME === '${
        process.env.PPD_SCREENSHOT_COMPARE_REGIME
      }' not supported. Try: ${JSON.stringify(regimesAvailable)}`,
    );
  }

  const rootFolder = path.resolve(
    path.join(
      this.argsEnv.PPD_ROOT,
      rootFolderIncome || process.env.PPD_SCREENSHOT_COMPARE_ROOT_FOLDER || 'screenshots',
    ),
  );
  const { Screenshot } = this.ppd;
  const screenshotInstance = new Screenshot(this.envs);

  const element = selector ? await this.getElement(selector) : null;
  const screenshot = selector
    ? await screenshotInstance.saveScreenshotElement(element)
    : await screenshotInstance.saveScreenshotFull();

  const folder = path.join(rootFolder, folderIncome || process.env.PPD_SCREENSHOT_COMPARE_FOLDER || '');

  const isCreateScreensRegime = process.env.PPD_SCREENSHOT_COMPARE_REGIME === 'create-screenshots';
  if (isCreateScreensRegime) {
    await Screenshot.copyScreenshotToFolder(screenshot, folder, name);
    await this.log({ text: `Screenshot create to compare: folder = '${folder}', name = '${name}'` });
  }

  const isCompareScreensRegime = process.env.PPD_SCREENSHOT_COMPARE_REGIME === 'compare-screenshots';
  if (isCompareScreensRegime) {
    const origin = path.join(folder, `${name}.png`);
    const compare = await looksSame(screenshot, origin, options);

    if (compare.equal) {
      await this.log({
        text: `Screenshots the same: folder = '${folder}', name = '${name}' with options: ${JSON.stringify(options)}`,
      });
    } else {
      const diff = path.join(this.envs.output.folderLatestFull, 'compare_diff.png');
      await createDiff({
        reference: origin,
        current: screenshot,
        diff,
        ...options,
      });
      await Screenshot.copyScreenshotToFolder(diff, this.envs.output.folderFull);
      await Screenshot.copyScreenshotToFolder(screenshot, this.envs.output.folderFull, 'compare_screensot.png');
      await Screenshot.copyScreenshotToFolder(origin, this.envs.output.folderFull, 'compare_origin.png');
      await Screenshot.copyScreenshotToFolder(screenshot, this.envs.output.folderLatestFull, 'compare_screensot.png');
      await Screenshot.copyScreenshotToFolder(origin, this.envs.output.folderLatestFull, 'compare_origin.png');

      throw new Error(
        `Screenshots not the same: folder = '${folder}', name = '${name}' with options: ${JSON.stringify(options)}`,
      );
    }
  }
};
