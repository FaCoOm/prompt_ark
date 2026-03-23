import type { JSX } from 'solid-js';
import { usePromptStore } from '@stores/promptStore';
import { useUIStore } from '../../stores/uiStore';

interface PaginationProps {
  totalPages: number;
}

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const pageSizeOptions = [10, 20, 50, 100];

export function Pagination(props: PaginationProps): JSX.Element {
  const promptStore = usePromptStore();
  const uiStore = useUIStore();

  const handlePrevious = () => {
    try {
      if (promptStore.currentPage > 1) {
        promptStore.setPage(promptStore.currentPage - 1);
      }
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to navigate page',
      });
    }
  };

  const handleNext = () => {
    try {
      if (promptStore.currentPage < props.totalPages) {
        promptStore.setPage(promptStore.currentPage + 1);
      }
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to navigate page',
      });
    }
  };

  const handlePageSizeChange = (e: Event) => {
    try {
      const target = e.target as HTMLSelectElement;
      const newSize = parseInt(target.value, 10);
      promptStore.setPageSize(newSize);
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to change page size',
      });
    }
  };

  return (
    <div class="pagination">
      <div class="pagination-controls">
        <button
          type="button"
          class="pagination-btn"
          onClick={handlePrevious}
          disabled={promptStore.currentPage <= 1}
          title="Previous page"
        >
          <ChevronLeftIcon />
        </button>

        <span class="pagination-info">
          Page {promptStore.currentPage} of {props.totalPages}
        </span>

        <button
          type="button"
          class="pagination-btn"
          onClick={handleNext}
          disabled={promptStore.currentPage >= props.totalPages}
          title="Next page"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div class="pagination-page-size">
        <label for="page-size">Show:</label>
        <select
          id="page-size"
          class="page-size-select"
          value={promptStore.pageSize}
          onChange={handlePageSizeChange}
        >
          {pageSizeOptions.map(size => (
            <option value={size}>{size}</option>
          ))}
        </select>
        <span>per page</span>
      </div>
    </div>
  );
}
