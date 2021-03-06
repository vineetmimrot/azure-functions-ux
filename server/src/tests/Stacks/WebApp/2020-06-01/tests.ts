import { WebAppStacksService20200601 } from '../../../../stacks/webapp/2020-06-01/stacks.service';
import {
  validateAllStackLength,
  validateWindowsStacks,
  validateLinuxStacks,
  validateNotHiddenStacks,
  validateNotDeprecatedStacks,
  validateNotPreviewStacks,
  validateASPInStacks,
  validateASPFilter,
  validateNodeInStacks,
  validateNodeFilter,
  validatePythonInStacks,
  validatePythonFilter,
  validatePHPInStacks,
  validatePHPFilter,
  validateDotnetCoreInStacks,
  validateDotnetCoreFilter,
  validateRubyInStacks,
  validateRubyFilter,
  validateJavaInStacks,
  validateJavaFilter,
  validateJavaContainersInStacks,
  validateJavaContainersFilter,
} from './validations';

const webAppStacksService = new WebAppStacksService20200601();

describe('WebApp Stacks Test 2020-06-01', () => {
  // Test length of all stacks
  describe('Test all stack length', () => {
    it('should validate all stacks are returned', done => {
      const stacks = webAppStacksService.getStacks();
      validateAllStackLength(stacks);
      done();
    });
  });

  // Test length of windows stacks
  describe('Test windows stack length', () => {
    it('should validate all stacks with windows are returned', done => {
      const stacks = webAppStacksService.getStacks('windows');
      validateWindowsStacks(stacks);
      done();
    });
  });

  // Test length of linux stacks
  describe('Test linux stack length', () => {
    it('should validate all stacks with linux are returned', done => {
      const stacks = webAppStacksService.getStacks('linux');
      validateLinuxStacks(stacks);
      done();
    });
  });

  // Test length of not hidden stacks
  describe('Test remove hidden stacks', () => {
    it('should validate no stacks with hidden are returned', done => {
      const stacks = webAppStacksService.getStacks(undefined, undefined, true);
      validateNotHiddenStacks(stacks);
      done();
    });
  });

  // Test length of not deprecated stacks
  describe('Test remove deprecated stacks', () => {
    it('should validate no stacks with deprecated are returned', done => {
      const stacks = webAppStacksService.getStacks(undefined, undefined, undefined, true);
      validateNotDeprecatedStacks(stacks);
      done();
    });
  });

  // Test length of not preview stacks
  describe('Test remove preview stacks', () => {
    it('should validate no stacks with preview are returned', done => {
      const stacks = webAppStacksService.getStacks(undefined, undefined, undefined, undefined, true);
      validateNotPreviewStacks(stacks);
      done();
    });
  });

  // Test ASP stack
  describe('Test the ASP stack', () => {
    it('should validate the ASP stack', done => {
      const stacks = webAppStacksService.getStacks();
      validateASPInStacks(stacks);
      done();
    });
  });

  // Test ASP stack filter
  describe('Test the ASP stack filter', () => {
    it('should validate the ASP stack filter', done => {
      const stacks = webAppStacksService.getStacks(undefined, 'aspnet');
      validateASPFilter(stacks);
      done();
    });
  });

  // Test Node stack
  describe('Test the Node stack', () => {
    it('should validate the Node stack', done => {
      const stacks = webAppStacksService.getStacks();
      validateNodeInStacks(stacks);
      done();
    });
  });

  // Test Node stack filter
  describe('Test the Node stack filter', () => {
    it('should validate the Node stack filter', done => {
      const stacks = webAppStacksService.getStacks(undefined, 'node');
      validateNodeFilter(stacks);
      done();
    });
  });

  // Test Python stack
  describe('Test the Python stack', () => {
    it('should validate the Python stack', done => {
      const stacks = webAppStacksService.getStacks();
      validatePythonInStacks(stacks);
      done();
    });
  });

  // Test Python stack filter
  describe('Test the Python stack filter', () => {
    it('should validate the Python stack filter', done => {
      const stacks = webAppStacksService.getStacks(undefined, 'python');
      validatePythonFilter(stacks);
      done();
    });
  });

  // Test PHP stack
  describe('Test the PHP stack', () => {
    it('should validate the PHP stack', done => {
      const stacks = webAppStacksService.getStacks();
      validatePHPInStacks(stacks);
      done();
    });
  });

  // Test PHP stack filter
  describe('Test the PHP stack filter', () => {
    it('should validate the PHP stack filter', done => {
      const stacks = webAppStacksService.getStacks(undefined, 'php');
      validatePHPFilter(stacks);
      done();
    });
  });

  // Test .NET Core stack
  describe('Test the .NET Core stack', () => {
    it('should validate the .NET Core stack', done => {
      const stacks = webAppStacksService.getStacks();
      validateDotnetCoreInStacks(stacks);
      done();
    });
  });

  // Test .NET Core stack filter
  describe('Test the .NET Core stack filter', () => {
    it('should validate the .NET Core stack filter', done => {
      const stacks = webAppStacksService.getStacks(undefined, 'dotnetcore');
      validateDotnetCoreFilter(stacks);
      done();
    });
  });

  // Test Ruby stack
  describe('Test the Ruby stack', () => {
    it('should validate the Ruby stack', done => {
      const stacks = webAppStacksService.getStacks();
      validateRubyInStacks(stacks);
      done();
    });
  });

  // Test Ruby stack filter
  describe('Test the Ruby stack filter', () => {
    it('should validate the Ruby stack filter', done => {
      const stacks = webAppStacksService.getStacks(undefined, 'ruby');
      validateRubyFilter(stacks);
      done();
    });
  });

  // Test Java stack
  describe('Test the Java stack', () => {
    it('should validate the Java stack', done => {
      const stacks = webAppStacksService.getStacks();
      validateJavaInStacks(stacks);
      done();
    });
  });

  // Test Java stack filter
  describe('Test the Java stack filter', () => {
    it('should validate the Java stack filter', done => {
      const stacks = webAppStacksService.getStacks(undefined, 'java');
      validateJavaFilter(stacks);
      done();
    });
  });

  // Test Java Containers stack
  describe('Test the Java Containers stack', () => {
    it('should validate the Java Containers stack', done => {
      const stacks = webAppStacksService.getStacks();
      validateJavaContainersInStacks(stacks);
      done();
    });
  });

  // Test Java Containers stack filter
  describe('Test the Java Containers stack filter', () => {
    it('should validate the Java Containers stack filter', done => {
      const stacks = webAppStacksService.getStacks(undefined, 'javacontainers');
      validateJavaContainersFilter(stacks);
      done();
    });
  });
});
