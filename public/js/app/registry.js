import { registerActionTarget } from './events.js';

const pageDefinitions = {
  chat: {
    load: () => {
      return Promise.all([
        import('../pages/chat.js'),
        import('../api/chat.js'),
      ]);
    },
    create: ({ module, api, username }) => {
      const getUserProfile = () => {
        return {
          initial: username?.charAt(0)?.toUpperCase() || 'U',
        };
      };

      return new module.ChatPage(api, getUserProfile);
    },
  },
  config: {
    load: () => {
      return Promise.all([
        import('../pages/config.js'),
        import('../api/config.js'),
      ]);
    },
    create: ({ module, api, onModelChange }) => {
      return new module.ConfigPage(api, onModelChange);
    },
    activate: ({ controller }) => {
      return controller.load();
    },
  },
  history: {
    load: () => {
      return Promise.all([
        import('../pages/history.js'),
        import('../api/history.js'),
      ]);
    },
    create: ({ module, api }) => {
      return new module.HistoryPage(api);
    },
    activate: ({ controller }) => {
      return controller.load();
    },
  },
  stats: {
    load: () => {
      return Promise.all([
        import('../pages/stats.js'),
        import('../api/stats.js'),
      ]);
    },
    create: ({ module, api, getActiveModel }) => {
      return new module.StatsPage(api, getActiveModel);
    },
    activate: ({ controller }) => {
      return controller.load();
    },
  },
  study: {
    load: () => {
      return Promise.all([
        import('../pages/study.js'),
        import('../api/study.js'),
      ]);
    },
    create: ({ module, api }) => {
      return new module.StudyPage(api);
    },
    activate: ({ controller }) => {
      return controller.load();
    },
  },
  users: {
    load: () => {
      return Promise.all([
        import('../pages/users.js'),
        import('../api/users.js'),
      ]);
    },
    create: ({ module, api, username }) => {
      const getCurrentUsername = () => {
        return username;
      };

      return new module.UsersPage(api, getCurrentUsername);
    },
    activate: ({ controller }) => {
      return controller.load();
    },
  },
  vocabulary: {
    load: () => {
      return Promise.all([
        import('../pages/vocabulary.js'),
        import('../api/vocabulary.js'),
      ]);
    },
    create: ({ module, api }) => {
      return new module.VocabularyPage(api);
    },
    activate: ({ controller }) => {
      return controller.load();
    },
  },
  quiz: {
    load: () => {
      return Promise.all([
        import('../pages/quiz.js'),
        import('../api/quiz.js'),
      ]);
    },
    create: ({ module, api }) => {
      return new module.QuizPage(api);
    },
    activate: ({ controller }) => {
      return controller.load();
    },
  },
  tech: {
    load: () => {
      return Promise.all([
        import('../pages/tech.js'),
        import('../api/tech.js'),
      ]);
    },
    create: ({ module, api, role }) => {
      return new module.TechPage(api, role);
    },
    activate: ({ controller }) => {
      return controller.load();
    },
  },
  learning: {
    load: () => {
      return import('../pages/learning.js');
    },
    create: ({ module }) => {
      return module.LearningPage;
    },
    activate: ({ controller }) => {
      return controller.init();
    },
  },
  openclaw: {
    load: () => {
      return Promise.all([
        import('../pages/openclaw.js'),
        import('../api/openclaw.js'),
      ]);
    },
    create: ({ module, api }) => {
      return {
        load: () => {
          return module.loadOpenClaw(api);
        },
        loadMore: () => {
          return module.openClawLoadMore(api);
        },
        controlAgent: (...args) => {
          return module.controlOpenClawAgent(api, ...args);
        },
        filtersChanged: () => {
          return module.openClawWorkflowFiltersChanged(api);
        },
      };
    },
    activate: ({ controller }) => {
      return controller.load();
    },
  },
  logs: {
    load: () => {
      return import('../pages/logs.js');
    },
    create: ({ module }) => {
      return {
        load: () => {
          return module.loadLogs();
        },
        viewFile: (filename) => {
          return module.viewLogFile(filename);
        },
        filter: () => {
          return module.filterLog();
        },
      };
    },
    activate: ({ controller }) => {
      return controller.load();
    },
  },
};

export function createPageRegistry(context) {
  const loadedPages = new Map();
  const loadingPages = new Map();

  return {
    async load(pageName) {
      const normalizedName = pageName === 'schedule' ? 'study' : pageName;

      if (loadedPages.has(normalizedName)) {
        return loadedPages.get(normalizedName);
      }

      if (!loadingPages.has(normalizedName)) {
        const definition = pageDefinitions[normalizedName];

        if (!definition) {
          throw new Error(`Unknown dashboard page: ${normalizedName}`);
        }

        const loadingPage = definition.load().then((loadedFeature) => {
          const [module, api] = Array.isArray(loadedFeature)
            ? loadedFeature
            : [
              loadedFeature,
              undefined,
            ];

          const controller = definition.create({
            ...context,
            module,
            api,
          });

          loadedPages.set(normalizedName, controller);
          registerActionTarget(normalizedName, controller);
          context.onPageCreated?.(normalizedName, controller);

          return controller;
        });

        loadingPages.set(normalizedName, loadingPage);
      }

      return loadingPages.get(normalizedName);
    },
    async activate(pageName) {
      const normalizedName = pageName === 'schedule' ? 'study' : pageName;
      const controller = await this.load(normalizedName);

      return pageDefinitions[normalizedName].activate?.({
        controller,
        ...context,
      });
    },
  };
}
