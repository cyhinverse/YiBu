export const createQueryChain = value => ({
  session() {
    return this;
  },
  select() {
    return this;
  },
  sort() {
    return this;
  },
  skip() {
    return this;
  },
  limit() {
    return this;
  },
  populate() {
    return this;
  },
  lean: async () => value,
  exec: async () => value,
  then(resolve, reject) {
    return Promise.resolve(value).then(resolve, reject);
  },
  catch(reject) {
    return Promise.resolve(value).catch(reject);
  },
});

export const runSchemaPreHook = (model, hookName, doc, args = []) =>
  new Promise((resolve, reject) => {
    model.schema.s.hooks.execPre(hookName, doc, args, error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

export const runSchemaPostHook = (model, hookName, doc, args = []) =>
  new Promise((resolve, reject) => {
    model.schema.s.hooks.execPost(hookName, doc, args, error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
