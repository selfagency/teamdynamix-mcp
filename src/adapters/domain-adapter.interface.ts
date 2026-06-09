/**
 * Base interface for all domain adapters.
 *
 * Each domain (tickets, assets, people, etc.) implements this interface
 * to provide a consistent abstraction over the SDK client methods.
 */
export interface DomainAdapter {
  /**
   * The domain name (e.g., 'tickets', 'assets', 'people').
   */
  readonly name: string;

  /**
   * The TeamDynamix SDK client instance.
   */
  readonly client: Record<string, unknown>;

  /**
   * The application ID for app-scoped domains.
   * undefined for global domains (e.g., projects, time).
   */
  readonly appId: number | undefined;

  /**
   * Executes a read operation on the domain.
   *
   * @param method - The operation name (e.g., 'get_ticket', 'list_applications')
   * @param params - The parameters for the operation
   * @returns The operation result
   */
  read(method: string, params: unknown): Promise<unknown>;

  /**
   * Executes a create mutation (if applicable).
   *
   * @param input - The entity to create
   * @returns The created entity
   */
  create?(input: unknown): Promise<unknown>;

  /**
   * Executes an update mutation (if applicable).
   *
   * @param id - The entity ID
   * @param input - The fields to update
   * @returns The updated entity
   */
  update?(id: number | string, input: unknown): Promise<unknown>;

  /**
   * Executes a delete mutation (if applicable).
   *
   * @param id - The entity ID
   * @param confirm - Whether deletion is confirmed (safety gate)
   * @returns The deletion result
   */
  delete?(id: number | string, confirm: boolean): Promise<unknown>;
}
