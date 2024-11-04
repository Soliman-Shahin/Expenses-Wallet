export interface PaginationModel {
  size?: number;
  page?: number;
}

export interface PagingResponse<T> {
	total: number;
	page: number;
	size: number;
	data: Array<T>;
	totalPages?: number;
	hasPreviousPage?: boolean;
	hasNextPage?: boolean;
	nextPageNumber?: number;
	previousPageNumber?: number;
}



export interface formIoPagination {
	limit?: number;
	skip?: number;
	sort?: string;
}
