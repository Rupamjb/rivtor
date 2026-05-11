"use client";

import { ContextPanel } from "@/components/context/context-panel";
import { ConversationWorkspace } from "@/components/chat/conversation-workspace";
import { FounderosSidebar } from "@/components/sidebar/founderos-sidebar";
import { useAuth } from "@/context/AuthContext";
import { useFounderosDashboard } from "@/hooks/use-founderos-dashboard";


export default function Workspace() {
  const { signOut } = useAuth();
  const {
    user,
    store,
    workflowHistory,
    activeWorkflowId,
    activeSidebarNav,
    startNewWorkflow,
    openWorkflow,
    selectSidebarNav,
    sendMessage,
    approveDraft,
    rejectDraft,
    publishDraft,
    saveDraft,
    connectLinkedInAccount,
    uploadFiles,
    trainFounderos,
    searchFounderMemory,
    memorySearchQuery,
    memorySearchBusy,
    memorySearchError,
    memorySearchItems,
    transcribeAudio,
    applyVoiceTranscript,
    applySuggestedAction,
  } = useFounderosDashboard();

  return (
    <div className="founderos-shell flex h-screen min-h-screen overflow-hidden text-zinc-100">
      <FounderosSidebar
        collapsed={store.sidebarCollapsed}
        mobileOpen={store.sidebarMobileOpen}
        onMobileOpen={store.setSidebarMobileOpen}
        onCollapse={() => store.setSidebarCollapsed(!store.sidebarCollapsed)}
        onNewWorkflow={startNewWorkflow}
        workflows={workflowHistory}
        activeNav={activeSidebarNav}
        onSelectNav={selectSidebarNav}
        activeWorkflowId={activeWorkflowId}
        onOpenWorkflow={openWorkflow}
        userEmail={user?.email || "founder@founderos.ai"}
        onSignOut={signOut}
      />

      <ConversationWorkspace
        store={store}
        onToggleSidebarMobile={() => store.setSidebarMobileOpen(true)}
        onToggleRightPanel={() => store.setRightPanelOpen(!store.rightPanelOpen)}
        onNewWorkflow={startNewWorkflow}
        onSend={sendMessage}
        onUpload={uploadFiles}
        onApprove={approveDraft}
        onReject={rejectDraft}
        onPublish={publishDraft}
        onSave={saveDraft}
        onVoiceStatus={store.setVoiceStatus}
        onVoiceError={store.setVoiceError}
        onDiscardVoice={store.clearVoice}
        onTranscribeAudio={transcribeAudio}
        onVoiceTranscript={applyVoiceTranscript}
        onSuggestedAction={applySuggestedAction}
      />

      {store.rightPanelOpen ? (
        <ContextPanel
          memory={store.contextMemory}
          research={store.contextResearch}
          badges={store.contextBadges}
          activities={store.activities}
          documents={store.documents}
          linkedInStatus={store.linkedInStatus}
          linkedInConnectedAt={store.linkedInConnectedAt}
          linkedInBusy={store.linkedInBusy}
          linkedInError={store.linkedInError}
          activeAgentStage={store.activeAgentStage}
          activeAgentLabel={store.activeAgentLabel}
          founderProfile={store.founderProfile}
          founderInsights={store.founderInsights}
          startupRadar={store.startupRadar}
          knowledgeGraphNodes={store.knowledgeGraphNodes}
          knowledgeGraphEdges={store.knowledgeGraphEdges}
          memorySearchQuery={memorySearchQuery}
          memorySearchBusy={memorySearchBusy}
          memorySearchError={memorySearchError}
          memorySearchItems={memorySearchItems}
          onSearchMemory={searchFounderMemory}
          onTrainFounderos={trainFounderos}
          onConnectLinkedIn={connectLinkedInAccount}
        />
      ) : null}
    </div>
  );
}
