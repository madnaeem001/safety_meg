import { describe, it, expect } from 'vitest';
import * as agileIndex from '../index';

describe('agile/index.ts barrel exports', () => {
  it('exports TaskDetailModal', () => {
    expect(agileIndex.TaskDetailModal).toBeDefined();
  });
  it('exports SprintPlanningView', () => {
    expect(agileIndex.SprintPlanningView).toBeDefined();
  });
  it('exports BacklogManagement', () => {
    expect(agileIndex.BacklogManagement).toBeDefined();
  });
  it('exports VelocityCharts', () => {
    expect(agileIndex.VelocityCharts).toBeDefined();
  });
  it('exports SprintRetrospectives', () => {
    expect(agileIndex.SprintRetrospectives).toBeDefined();
  });
  it('exports ReleasePlanningView', () => {
    expect(agileIndex.ReleasePlanningView).toBeDefined();
  });
  it('exports SprintSettings', () => {
    expect(agileIndex.SprintSettings).toBeDefined();
  });
  it('exports WorkflowAutomation', () => {
    expect(agileIndex.WorkflowAutomation).toBeDefined();
  });
  it('exports ProjectCharter', () => {
    expect(agileIndex.ProjectCharter).toBeDefined();
  });
  it('exports ProjectClosure', () => {
    expect(agileIndex.ProjectClosure).toBeDefined();
  });
  it('exports CommandPalette', () => {
    expect(agileIndex.CommandPalette).toBeDefined();
  });
  it('exports QuickActionsBar', () => {
    expect(agileIndex.QuickActionsBar).toBeDefined();
  });
  it('exports useKeyboardShortcuts', () => {
    expect(agileIndex.useKeyboardShortcuts).toBeDefined();
  });
  it('exports useBatchSelection', () => {
    expect(agileIndex.useBatchSelection).toBeDefined();
  });
  it('exports BatchActionsToolbar', () => {
    expect(agileIndex.BatchActionsToolbar).toBeDefined();
  });
});
