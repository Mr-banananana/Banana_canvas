$app = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\public\app.js')
$styles = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\public\styles.css')
$html = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\public\index.html')
$server = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\server.js')
$package = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\package.json')
$readme = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\README.md')
$dockerfile = if (Test-Path (Join-Path $PSScriptRoot '..\Dockerfile')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\Dockerfile') } else { '' }
$render = if (Test-Path (Join-Path $PSScriptRoot '..\render.yaml')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\render.yaml') } else { '' }
$gitignore = if (Test-Path (Join-Path $PSScriptRoot '..\.gitignore')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\.gitignore') } else { '' }
$startBat = if (Test-Path (Join-Path $PSScriptRoot '..\start.bat')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\start.bat') } else { '' }
$startPs1 = if (Test-Path (Join-Path $PSScriptRoot '..\start.ps1')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\start.ps1') } else { '' }
$startCommand = if (Test-Path (Join-Path $PSScriptRoot '..\start.command')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\start.command') } else { '' }
$startSh = if (Test-Path (Join-Path $PSScriptRoot '..\start.sh')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\start.sh') } else { '' }
$assetGrid = [regex]::Match($styles, '\.commerce-asset-grid\s*\{[^}]*\}').Value
$pointerDownBlock = [regex]::Match($app, 'els\.viewport\.addEventListener\("pointerdown", event => \{[\s\S]*?if \(event\.button === 2\)').Value
$wheelBlock = [regex]::Match($app, 'els\.viewport\.addEventListener\("wheel", event => \{[\s\S]*?\}, \{ passive: false \}\);').Value

$checks = @(
  @{
    Name = 'pointer movement uses incremental interaction frames'
    Pass = $app -match 'function scheduleInteractionFrame\(' -and
      $app -match 'function flushInteractionFrame\(' -and
      $app -match 'if \(state\.drag\)[\s\S]*?scheduleInteractionFrame' -and
      $app -notmatch 'if \(state\.drag\)[\s\S]{0,500}?render\(\)'
  },
  @{
    Name = 'interaction frames preserve media DOM'
    Pass = $app -match 'function updateCardTransforms\(' -and
      $app -match 'node\.style\.transform' -and
      $app -match 'function updateCardTransforms\(\)\s*\{(?:(?!innerHTML)[\s\S])*?\n\}'
  },
  @{
    Name = 'state tracks a lasso selection rectangle'
    Pass = $app -match 'selectionBox:\s*null'
  },
  @{
    Name = 'blank left pointer starts selection instead of viewport pan'
    Pass = $app -match 'state\.selectionBox\s*=\s*\{[\s\S]*?startWorld' -and
      $app -notmatch 'state\.selectedId\s*=\s*null;\s*state\.pan\s*=\s*\{\s*startX:\s*event\.clientX'
  },
  @{
    Name = 'selection rectangle is rendered on the canvas'
    Pass = $app -match 'class="selection-box"'
  },
  @{
    Name = 'selection rectangle has visible styling'
    Pass = $styles -match '\.selection-box'
  },
  @{
    Name = 'left add button explicitly opens palette and stops bubbling'
    Pass = $app -match 'els\.addNodeButton\.addEventListener\("click",\s*event\s*=>\s*\{[\s\S]*?event\.stopPropagation\(\);[\s\S]*?els\.nodePalette\.classList\.remove\("hidden"\);[\s\S]*?\}\);'
  },
  @{
    Name = 'node palette clicks are ignored by canvas pointer selection'
    Pass = $app -match 'event\.target\.closest\("\.context-menu"\) \|\| event\.target\.closest\("\.node-control-dock"\) \|\| event\.target\.closest\("\.connection-create-menu"\) \|\| event\.target\.closest\("\.node-palette"\)\) return;'
  },
  @{
    Name = 'node dock is offset below selected node without crowding'
    Pass = $app -match 'const gap = (2[4-9]|3[0-6]);'
  },
  @{
    Name = 'dock has custom hover size picker shell'
    Pass = $html -match 'id="sizePicker"' -and $html -match 'id="sizePickerMenu"' -and $styles -match '\.size-picker:hover\s+\.size-popover'
  },
  @{
    Name = 'image and video size menus render distinct controls'
    Pass = $app -match 'function renderImageSizeMenu' -and $app -match 'function renderVideoSizeMenu' -and $app -match '图像质量' -and $app -match '生成视频音频'
  },
  @{
    Name = 'size picker actions update card generation parameters'
    Pass = $app -match 'setupSizePicker' -and $app -match 'data-size-action' -and $app -match 'applySizePickerAction' -and $app -match 'imageQuality' -and $app -match 'generate_audio'
  },
  @{
    Name = 'video request includes selected audio flag'
    Pass = $app -match 'generate_audio: card\.generate_audio' -and $server -match 'generate_audio: typeof payload\.generate_audio === "boolean" \? payload\.generate_audio : undefined'
  },
  @{
    Name = 'size picker hover bridge keeps popover reachable'
    Pass = $styles -match '\.size-picker::before' -and $styles -match 'height:\s*2[0-9]px' -and $styles -match 'bottom:\s*100%'
  },
  @{
    Name = 'reference preview floats above dock popovers'
    Pass = $styles -match '\.ref-thumb:hover\s*\{[\s\S]*?z-index:\s*2[0-9]{2}' -and $styles -match '\.ref-thumb i\s*\{[\s\S]*?z-index:\s*3[0-9]{2}'
  },
  @{
    Name = 'middle-button pan is handled before dock pointer guard'
    Pass = $pointerDownBlock.IndexOf('if (event.button === 1)') -ge 0 -and $pointerDownBlock.IndexOf('if (event.button === 1)') -lt $pointerDownBlock.IndexOf('event.target.closest(".node-control-dock")')
  },
  @{
    Name = 'middle-button pan has a clear active cursor and cancellation cleanup'
    Pass = $app -match 'classList\.add\("is-panning"\)' -and
      $app -match 'classList\.remove\("is-panning"\)' -and
      $app -match 'pointercancel' -and
      $styles -match '\.canvas-viewport\.is-panning'
  },
  @{
    Name = 'mouse wheel pans the canvas without changing zoom'
    Pass = $wheelBlock -match 'isZoomGesture' -and
      $wheelBlock -match 'state\.viewport\.y\s*[-+]=[\s\S]*?event\.deltaY[\s\S]*?render\(\);' -and
      $wheelBlock -match 'else' -and
      $wheelBlock -match 'state\.viewport\.scale\s*='
  },
  @{
    Name = 'ctrl wheel zooms around the pointer position'
    Pass = $wheelBlock -match 'const isZoomGesture = event\.ctrlKey' -and
      $wheelBlock -match 'clientToWorld\(event\.clientX, event\.clientY\)' -and
      $wheelBlock -match 'Math\.min\(2\.5[\s\S]*?Math\.max\(0\.25' -and
      $wheelBlock -match 'event\.clientX[\s\S]*?state\.viewport\.x' -and
      $wheelBlock -match 'event\.clientY[\s\S]*?state\.viewport\.y'
  },
  @{
    Name = 'ctrl wheel is not blocked by the node dock guard'
    Pass = $wheelBlock -match 'if \(!isZoomGesture && event\.target\.closest\("\.node-control-dock"\)\) return;' -and
      $wheelBlock -match 'if \(isZoomGesture\)'
  },
  @{
    Name = 'edge anchors use measured node layout height'
    Pass = $app -match 'function syncCardLayoutMetrics\(' -and $app -match 'card\.layoutH \?\? card\.h'
  },
  @{
    Name = 'node dock uses measured node bottom'
    Pass = $app -match 'card\.layoutH \?\? card\.h'
  },
  @{
    Name = 'node dock sits close to selected node without overlap'
    Pass = $app -match 'const gap = (2[4-9]|3[0-6]);' -and $app -match 'card\.layoutH \?\? card\.h'
  },
  @{
    Name = 'node dock clamps horizontally inside the canvas viewport'
    Pass = $app -match 'const rawLeft = nodeCenterX - dockWidth / 2' -and
      $app -match 'Math\.min\(Math\.max\(margin, rawLeft\), maxLeft\)'
  },
  @{
    Name = 'node dock avoids overlapping neighboring cards when possible'
    Pass = $app -match 'const otherCards = state\.cards[\s\S]*?\.filter' -and
      $app -match 'top < otherBottom' -and
      $app -match 'top = otherBottom \+ gap'
  },
  @{
    Name = 'node dock may be clipped instead of panning the canvas'
    Pass = $app -match 'dock\.style\.top = `\$\{Math\.round\(top\)\}px`' -and
      $app -notmatch 'const dockOverflow = top \+ dockHeight'
  },
  @{
    Name = 'node palette is positioned as a viewport overlay'
    Pass = $styles -match '\.node-palette\s*\{[\s\S]*position:\s*fixed' -or $app -match 'function positionNodePalette\('
  },
  @{
    Name = 'size popover is clamped inside the browser viewport'
    Pass = $app -match 'function positionSizePopover\(' -and $app -match 'sizePopover'
  },
  @{
    Name = 'reference preview is positioned next to the thumbnail with a hover bridge'
    Pass = $styles -match '\.ref-thumb::before' -and $styles -match 'left:\s*calc\(100% - 2px\)' -and $styles -match '\.ref-thumb i\s*\{[\s\S]*?left:\s*calc\(100% \+ 6px\)' -and $styles -match '\.ref-thumb i a\s*\{[\s\S]*?pointer-events:\s*auto'
  },
  @{
    Name = 'aspect icons preserve the selected ratio inside a fixed frame'
    Pass = $app -match 'aspectIconStyle\(option\)' -and $app -match '--aspect-w' -and $app -match '--aspect-h' -and $styles -match '\.aspect-icon-frame' -and $styles -match 'width:\s*var\(--aspect-w\)' -and $styles -match 'height:\s*var\(--aspect-h\)'
  },
  @{
    Name = 'import and export controls use the shared button typography'
    Pass = $styles -match '\.text-btn,\s*\.ghost-btn,\s*\.primary-btn\s*\{[\s\S]*?font:\s*inherit' -and $styles -match '\.file-label\s*\{[\s\S]*?font:\s*inherit'
  },
  @{
    Name = 'connections and nodes have responsive interaction motion'
    Pass = $styles -match '\.connection-path\s*\{[\s\S]*transition:' -and $styles -match '\.card\s*\{[\s\S]*transition:' -and $styles -match '@media \(prefers-reduced-motion: reduce\)'
  },
  @{
    Name = 'opening operation instructions closes other canvas overlays'
    Pass = $app -match 'function openShortcuts\(\)\s*\{[\s\S]*?hideContextMenu\(\);[\s\S]*?hideConnectionCreateMenu\(\);[\s\S]*?els\.nodePalette\.classList\.add\("hidden"\);'
  },
  @{
    Name = 'canvas management persists groups and local snapshots'
    Pass = $app -match 'groups:' -and
      $app -match 'canvasSnapshots:' -and
      $app -match 'normalizeCanvasGroup' -and
      $app -match 'canvasSnapshot'
  },
  @{
    Name = 'local canvas library supports migration, switching, and persistence'
    Pass = $html -match 'id="openCanvasLibrary"' -and
      $html -match 'id="newCanvas"' -and
      $html -match 'id="canvasLibraryList"' -and
      $app -match 'CANVAS_LIBRARY_SCHEMA' -and
      $app -match 'function switchCanvas\(' -and
      $app -match 'function createNewCanvas\(' -and
      $app -match 'Array\.isArray\(saved\.canvases\)'
  },
  @{
    Name = 'canvas library exports and imports all local workflows'
    Pass = $app -match 'canvases: cloneData\(canvasLibrary\.canvases\)' -and
      $app -match 'if \(Array\.isArray\(data\.canvases\)\)' -and
      $app -match 'applyCanvasRecord\(activeCanvasRecord\(\)\)'
  },
  @{
    Name = 'deleting the last canvas creates a new empty canvas'
    Pass = $app -match 'function deleteActiveCanvas\(\)' -and
      $app -match 'if \(!canvasLibrary\.canvases\.length\)' -and
      $app -match 'createCanvasRecord\("未命名画布"' -and
      $app -match 'canvasLibrary\.canvases\.push\(blank\)'
  },
  @{
    Name = 'canvas supports grouping and dependency-aware auto layout'
    Pass = $html -match 'id="groupSelection"' -and
      $html -match 'id="autoLayout"' -and
      $app -match 'function groupSelectedCards\(' -and
      $app -match 'function autoLayoutCards\(' -and
      $app -match 'data-group-id'
  },
  @{
    Name = 'canvas exposes minimap and node search'
    Pass = $html -match 'id="canvasSearch"' -and
      $html -match 'id="minimapCanvas"' -and
      $app -match 'function renderMinimap\(' -and
      $app -match 'function focusCard\('
  },
  @{
    Name = 'minimap is visible by default at a readable size'
    Pass = $html -match '<aside id="minimap" class="minimap"' -and
      $html -match '<canvas id="minimapCanvas" width="300" height="190"' -and
      $styles -match '\.minimap\s*\{[^}]*width:\s*300px' -and
      $styles -match '\.minimap\s*\{[^}]*height:\s*190px'
  },
  @{
    Name = 'canvas exposes undo redo and named history snapshots'
    Pass = $html -match 'id="historyMenu"' -and
      $app -match 'function undoCanvas\(' -and
      $app -match 'function redoCanvas\(' -and
      $app -match 'function createCanvasSnapshot\(' -and
      $html -match 'Ctrl\+Z'
  },
  @{
    Name = 'topbar dropdowns are not clipped by the scrolling command row'
    Pass = $styles -notmatch '\.top-actions\s*\{[^}]*overflow-y:\s*hidden'
  },
  @{
    Name = 'node dragging calculates a browser-edge auto-pan velocity'
    Pass = $app -match 'function dragEdgeVelocity\(' -and
      $app -match 'DRAG_EDGE_MARGIN' -and
      $app -match 'DRAG_EDGE_MAX_SPEED'
  },
  @{
    Name = 'node dragging keeps moving while the pointer stays at the edge'
    Pass = $app -match 'function continueDragAutoPan\(' -and
      $app -match 'requestAnimationFrame\(continueDragAutoPan\)' -and
      $app -match 'state\.viewport\.x\s*\+=' -and
      $app -match 'updateDraggedCards\(drag\.lastClientX, drag\.lastClientY\)'
  },
  @{
    Name = 'commerce is a dedicated left-toolbar workspace entry'
    Pass = $html -match 'id="commerceTool"' -and $html -match 'data-tool="commerce"' -and $html -notmatch 'data-create="commerce"'
  },
  @{
    Name = 'product video is a dedicated left-toolbar workspace entry'
    Pass = $html -match 'id="productVideoTool"' -and $html -match 'data-tool="product-video"' -and $html -notmatch 'data-create="product-video"'
  },
  @{
    Name = 'left toolbar removes upload and select movement entries'
    Pass = $html -notmatch 'id="uploadBtn"' -and $html -notmatch 'data-tool="select"'
  },
  @{
    Name = 'left toolbar exposes a canvas return entry'
    Pass = $html -match 'id="returnCanvasTool"' -and $html -match 'data-tool="canvas"' -and $html -match 'title="返回画布"'
  },
  @{
    Name = 'canvas return entry switches workspace mode to canvas'
    Pass = $app -match 'returnCanvasTool' -and $app -match 'els\.returnCanvasTool\.addEventListener\("click"' -and $app -match 'setWorkspaceMode\("canvas"\)'
  },
  @{
    Name = 'upload remains available from the node palette'
    Pass = $html -match 'id="paletteUpload"' -and $app -match 'document\.getElementById\("paletteUpload"\)' -and $app -match 'document\.getElementById\("uploadInput"\)\.addEventListener\("change", handleUpload\)'
  },
  @{
    Name = 'product video workspace exposes product upload and generation controls'
    Pass = $html -match 'id="productVideoWorkspace"' -and
      $html -match 'id="productVideoUploadInput"' -and
      $html -match 'data-product-video-slot="product"' -and
      $html -match 'id="productVideoPrompt"' -and
      $html -match 'id="productVideoGenerate"'
  },
  @{
    Name = 'product video workspace exposes supported video parameters'
    Pass = $html -match 'id="productVideoAspect"' -and
      $html -match 'id="productVideoResolution"' -and
      $html -match 'id="productVideoDuration"' -and
      $html -match 'id="productVideoFps"' -and
      $html -match 'id="productVideoAudio"'
  },
  @{
    Name = 'product video workspace has a scrollable temporary video library'
    Pass = $html -match 'id="productVideoAssetLibrary"' -and
      $html -match 'id="productVideoAssetGrid"' -and
      $styles -match '\.commerce-asset-library\s*\{[\s\S]*overflow-y:\s*auto' -and
      $styles -match '\.product-video-workspace\s+\.commerce-asset-media'
  },
  @{
    Name = 'product video state is persisted and normalized'
    Pass = $app -match 'productVideoWorkspace:' -and
      $app -match 'normalizeProductVideoWorkspace' -and
      $app -match 'productVideoWorkspace: state.productVideoWorkspace' -and
      $app -match 'data.productVideoWorkspace'
  },
  @{
    Name = 'product video uploads an image and validates the product requirement'
    Pass = $app -match 'handleProductVideoUpload' -and
      $app -match '产品视频只支持图片文件' -and
      $app -match '先上传产品图'
  },
  @{
    Name = 'product video calls Agnes create and result endpoints'
    Pass = $app -match 'generateProductVideo' -and
      $app -match 'pollProductVideo' -and
      $app -match 'postJson\("/api/agnes/video"' -and
      $app -match 'postJson\("/api/agnes/video-result"'
  },
  @{
    Name = 'product video sends the product image as the only reference'
    Pass = $app -match 'imageRefs: \[workspace\.productRef\.url\]' -and
      $app -match 'productVideoPrompt'
  },
  @{
    Name = 'product video results are independent and offer canvas and download actions'
    Pass = $app -match 'function storeProductVideoResult' -and
      $app -match 'workspace\.results\.unshift' -and
      $app -match 'addProductVideoResultToCanvas' -and
      $app -match 'downloadProductVideoResult' -and
      $app -match 'data-product-video-action="add"' -and
      $app -match 'data-product-video-action="download"'
  },
  @{
    Name = 'commerce workspace has product model and scene upload slots'
    Pass = $html -match 'id="commerceWorkspace"' -and
      $html -match 'data-commerce-workspace-slot="product"' -and
      $html -match 'data-commerce-workspace-slot="model"' -and
      $html -match 'data-commerce-workspace-slot="scene"'
  },
  @{
    Name = 'commerce workspace has a scrollable temporary asset library'
    Pass = $html -match 'id="commerceAssetLibrary"' -and $styles -match '\.commerce-asset-library[\s\S]*overflow-y:\s*auto'
  },
  @{
    Name = 'commerce workspace uses equal-width control and asset columns'
    Pass = $styles -match '\.commerce-workspace\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)'
  },
  @{
    Name = 'commerce asset preview offers add-to-canvas and download actions'
    Pass = $app -match 'addCommerceWorkspaceResultToCanvas' -and
      $app -match 'downloadCommerceWorkspaceResult' -and
      $app -match 'data-commerce-preview-action="add"' -and
      $app -match 'data-commerce-preview-action="download"'
  },
  @{
    Name = 'commerce generation stores results outside canvas until explicitly added'
    Pass = $app -match 'commerceWorkspace\.results' -and
      $app -match 'renderCommerceWorkspace' -and
      $app -match 'createCard\("upload"'
  },
  @{
    Name = 'commerce workflow validates required product image'
    Pass = $app -match '请先上传商品图' -and $app -match 'generateCommercePromo'
  },
  @{
    Name = 'commerce workflow sends role-aware image references'
    Pass = $app -match 'imageRoles' -and $app -match 'productRef' -and $app -match 'sceneRef'
  },
  @{
    Name = 'custom API receives all commerce references'
    Pass = $app -match 'imageRefs: refs\.imageRefs' -and $server -match 'imageRoles'
  },
  @{
    Name = 'commerce results create independent image asset cards'
    Pass = $app -match 'createCommerceResultCard' -and $app -match 'commerceResultIds'
  },
  @{
    Name = 'commerce references belong to the selected commerce card'
    Pass = $app -match 'selectedCommerceCard' -and $app -match 'card\.productRef' -and $app -match 'card\.sceneRef'
  },
  @{
    Name = 'commerce workspace exposes optional Agnes prompt generation mode'
    Pass = $html -match 'id="commerceWorkspacePromptMode"' -and
      $html -match 'id="commerceWorkspacePromptButton"' -and
      $app -match 'commerceWorkspacePromptMode'
  },
  @{
    Name = 'commerce prompt generation calls Agnes chat completions'
    Pass = $app -match 'generateCommercePrompt' -and
      $app -match '/api/agnes/prompt' -and
      $server -match 'handleAgnesPrompt' -and
      $server -match 'chat/completions'
  },
  @{
    Name = 'Agnes prompt generation sends role-aware multimodal image content'
    Pass = $server -match 'image_url' -and
      $server -match 'imageRoles' -and
      $app -match 'promptModel'
  },
  @{
    Name = 'commerce image generation requires an auto-generated prompt when mode is enabled'
    Pass = $app -match '请先生成提示词' -and
      $app -match 'commercePromptMode === "auto"'
  },
  @{
    Name = 'Agnes image requests use supported size and ratio fields'
    Pass = $app -match 'function agnesImageRatio\(' -and
      $app -match 'function agnesImageSize\(' -and
      $app -match 'request\.ratio = agnesImageRatio' -and
      $server -match 'ratio: payload\.ratio' -and
      $app -notmatch 'model: settings\.imageModel,[\s\S]*?size: "1024x1280"'
  },
  @{
    Name = 'Agnes prompt generation builds product detail page selling points'
    Pass = $server -match '商品类别' -and
      $server -match '核心卖点' -and
      $server -match '单张海报' -and
      $server -match '单一画面' -and
      $server -match '不得臆造'
  },
  @{
    Name = 'commerce generation is restricted to one poster composition'
    Pass = $app -match 'type === "commerce" \? "2k"' -and
      $server -match '不要多屏' -and
      $server -match '不要九宫格' -and
      $server -match '不要生成小字'
  },
  @{
    Name = 'commerce asset thumbnails use compact cards while keeping hover preview'
    Pass = $assetGrid -match 'grid-template-columns:\s*repeat\(auto-fill, minmax\(1[4-8][0-9]px, 1fr\)\)' -and
      $assetGrid -match 'gap:\s*1[0-4]px' -and
      $styles -match '\.commerce-asset-card:hover \.commerce-asset-large'
  },
  @{
    Name = 'server routes Agnes requests through the configured HTTPS proxy'
    Pass = $server -match 'HTTPS_PROXY' -and
      $server -match 'CONNECT' -and
      $server -match 'proxy-authorization'
  },
  @{
    Name = 'Agnes commerce prompt forbids multi-screen prompt structures'
    Pass = $server -match '画面一、画面二、画面三' -and
      $server -match '最多三个简短卖点标签' -and
      $server -match '只返回一段'
  },
  @{
    Name = 'Agnes prompt generation requests a fresh variation each time'
    Pass = $app -match 'promptGeneration' -and
      $app -match 'generationId' -and
      $server -match 'variation' -and
      $server -match 'temperature:\s*0\.(7[0-9]|8[0-9])'
  },
  @{
    Name = 'Agnes prompt generation reads the current textarea value'
    Pass = $app -match 'promptHintFor\(workspace,\s*els\.commerceWorkspacePrompt\.value\)' -and
      $app -match 'current\s*!==\s*String\(target\.lastGeneratedPrompt'
  },
  @{
    Name = 'commerce image policy blocks use one safe retry and a readable error'
    Pass = $app -match 'function isContentPolicyViolation\(' -and
      $app -match 'function commerceSafePrompt\(' -and
      $app -match 'isContentPolicyViolation\(error\)' -and
      $app -match 'content_policy_violation' -and
      $app -match 'const safeRequest = \{ \.\.\.request, prompt: commerceSafePrompt\(\) \}' -and
      $app -match 'retryError\.message = commercePolicyErrorMessage'
  },
  @{
    Name = 'Agnes commerce prompt avoids sensitive expansions that can trigger policy blocks'
    Pass = $server -match '只使用安全、普通、适合电商的内容' -and
      $server -match '医疗功效' -and
      $server -match '最多三个简短卖点标签'
  },
  @{
    Name = 'commerce image requests protect Chinese typography and product identity'
    Pass = $app -match 'COMMERCE_IMAGE_GUARDRAILS' -and
      $app -match 'workflow: card\.type' -and
      $server -match 'payload\.workflow === "commerce"' -and
      $server -match '不要生成任何可读文字' -and
      $server -match '商品身份锁定'
  },
  @{
    Name = 'Agnes prompt responses support OpenAI and wrapped text formats'
    Pass = $app -match 'function promptValueText\(' -and
      $app -match 'output_text' -and
      $app -match 'response\?\.choices' -and
      $app -match 'response\?\.output' -and
      $app -match 'response\?\.data'
  },
  @{
    Name = 'Agnes prompt responses support delta, body, JSON, and SSE wrappers'
    Pass = $app -match 'value\.delta\?\.content' -and
      $app -match 'value\.body' -and
      $app -match 'value\.prompt' -and
      $app -match 'JSON\.parse\(trimmed\)' -and
      $app -match 'data:\\s\*'
  },
  @{
    Name = 'Agnes prompt 504s retry once and show a readable timeout error'
    Pass = $app -match 'function isUpstreamTimeout\(' -and
      $app -match 'function requestAgnesPrompt\(' -and
      $app -match 'await sleep\(1[0-9]{3}\)' -and
      $app -match 'isUpstreamTimeout\(error\)' -and
      $app -match 'if \(isUpstreamTimeout\(error\)\) error\.message' -and
      $app -match '上游响应超时' -and
      $app -match 'typeof data\.details\?\.response === "string"'
  },
  @{
    Name = 'Agnes empty prompt responses expose refusal and finish diagnostics'
    Pass = $app -match 'reasoning_content' -and
      $app -match 'function promptResponseError\(' -and
      $app -match 'finish_reason' -and
      $app -match 'refusal' -and
      $app -match '响应字段'
  },
  @{
    Name = 'prompt fixes are cache-busted in the served page'
    Pass = $html -match 'app\.js\?v=canvas-controls-9' -and $html -match 'styles\.css\?v=canvas-controls-9'
  },
  @{
    Name = 'server exposes a deployment health endpoint'
    Pass = $server -match 'url\.pathname === "/healthz"' -and $server -match 'status: "ok"'
  },
  @{
    Name = 'repository includes a production container entrypoint'
    Pass = $dockerfile -match 'FROM node:18' -and $dockerfile -match 'CMD \["npm", "start"\]' -and $dockerfile -match 'EXPOSE 5177'
  },
  @{
    Name = 'repository includes Render deployment metadata'
    Pass = $render -match 'type:\s*web' -and $render -match 'healthCheckPath:\s*/healthz' -and $render -match 'startCommand:\s*npm start'
  },
  @{
    Name = 'repository ignores local secrets and runtime files'
    Pass = $gitignore -match '\.env' -and $gitignore -match 'node_modules/' -and $gitignore -match 'outputs/'
  },
  @{
    Name = 'README documents public deployment and API key handling'
    Pass = $readme -match 'Render' -and $readme -match 'Docker' -and $readme -match 'API Key' -and $readme -match 'GitHub Pages'
  },
  @{
    Name = 'Windows starter launches the local server and browser'
    Pass = $startBat -match 'node server\.js' -and $startBat -match 'localhost:5177' -and $startBat -match 'where node'
  },
  @{
    Name = 'PowerShell starter works without npm installation'
    Pass = $startPs1 -match '-FilePath "node"' -and $startPs1 -match '-ArgumentList "server\.js"' -and $startPs1 -match 'localhost:5177' -and $startPs1 -notmatch 'npm install'
  },
  @{
    Name = 'README has a download and double-click quick start'
    Pass = ($readme -match '下载 ZIP' -or $readme -match 'Download ZIP') -and $readme -match 'start\.bat' -and $readme -match '不需要.*npm install'
  },
  @{
    Name = 'macOS starter launches the local server and browser'
    Pass = $startCommand -match '#!/bin/bash' -and $startCommand -match 'node server\.js' -and $startCommand -match 'open.*localhost:5177' -and $startSh -match 'node server\.js'
  },
  @{
    Name = 'README documents macOS double-click startup'
    Pass = $readme -match 'start\.command' -and $readme -match 'macOS'
  }
)

$failed = $checks | Where-Object { -not $_.Pass }
foreach ($check in $checks) {
  $mark = if ($check.Pass) { 'PASS' } else { 'FAIL' }
  Write-Host "$mark $($check.Name)"
}

if ($failed) {
  exit 1
}
